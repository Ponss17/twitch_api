import { supabase } from './supabaseClient';
import { StoredUser } from '../../types/twitch';
import { encrypt, decrypt, ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY } from './cryptoService';
import { invalidateAllUserCaches } from '../utils/cacheInvalidation';
import * as cacheService from './cacheService';
import { CACHE_TTL_MATRIX } from '../config/cacheTtl';
import { DEFAULT_USER_ROLE, normalizeUserRole } from '../config/userRoles';
import { logger } from '../utils/logger';
import { BoundedMap } from '../utils/boundedCache';
import { setUserTimezone, clearUserTimezone } from './userTimezoneCache';

/** L1 en RAM de la instancia serverless — evita round-trips a KV/Supabase en bots activos. */
const userMemoryCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
const pendingGetUser = new Map<string, Promise<StoredUser | null>>();

export const invalidateUserMemoryCache = (userId: string): void => {
    userMemoryCache.delete(userId);
    pendingGetUser.delete(userId);
    clearUserTimezone(userId);
};

const migratedUsersCache = new Set<string>();
const MAX_MIGRATED_CACHE = 500;

const addToMigratedCache = (userId: string) => {
    if (migratedUsersCache.size >= MAX_MIGRATED_CACHE) {
        const first = migratedUsersCache.keys().next().value;
        if (first) migratedUsersCache.delete(first);
    }
    migratedUsersCache.add(userId);
};

const isAlreadyEncrypted = (val: string) => {
    const parts = val.split(':');
    return (
        parts.length === 2 &&
        parts[0].length === 32 &&
        /^[0-9a-f]+$/i.test(parts[0]) &&
        /^[0-9a-f]+$/i.test(parts[1])
    );
};

async function decryptAndMigrateIfNeeded(
    user: StoredUser,
    context: string
): Promise<StoredUser | null> {
    let usedLegacy = false;

    try {
        if (user.accessToken) {
            try {
                user.accessToken = decrypt(user.accessToken, ENCRYPTION_KEY);
            } catch {
                user.accessToken = decrypt(user.accessToken, LEGACY_ENCRYPTION_KEY);
                usedLegacy = true;
            }
        }
        if (user.refreshToken) {
            try {
                user.refreshToken = decrypt(user.refreshToken, ENCRYPTION_KEY);
            } catch {
                user.refreshToken = decrypt(user.refreshToken, LEGACY_ENCRYPTION_KEY);
                usedLegacy = true;
            }
        }
    } catch (e) {
        logger.error(`❌ Descifrado fallido para ${context}:`, (e as Error).message);
        return null;
    }

    if (usedLegacy && !migratedUsersCache.has(user.userId)) {
        addToMigratedCache(user.userId);
        logger.info(`🔄 Migrando claves de cifrado para usuario: ${user.login} (${user.userId})`);
        await saveUser(user).catch((e) => logger.error('Error migrando usuario:', e));
    }

    return user;
}

// Convierte un StoredUser del sistema al formato de columnas de Supabase
function toRow(user: StoredUser): Record<string, unknown> {
    return {
        user_id: user.userId,
        login: user.login,
        display_name: user.displayName,
        access_token: user.accessToken ?? null,
        refresh_token: user.refreshToken ?? null,
        api_key: user.apiKey ?? null,
        is_active: user.isActive ?? true,
        blocked_reason: user.blockedReason ?? null,
        custom_rate_limit: user.customRateLimit ?? null,
        custom_cache_ttl: user.customCacheTtl ?? null,
        role: user.role ?? DEFAULT_USER_ROLE,
        profile_image_url: user.profileImageUrl ?? null,
        timezone: user.timezone ?? 'UTC',
        last_active: user.lastActive
            ? new Date(user.lastActive).toISOString()
            : new Date().toISOString(),
        created_at: user.createdAt
            ? new Date(user.createdAt).toISOString()
            : new Date().toISOString(),
        token_expires_at: resolveTokenExpiresAtIso(user)
    };
}

function resolveTokenExpiresAtIso(user: StoredUser): string | null {
    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        return new Date(user.tokenExpiresAt).toISOString();
    }
    if (user.obtainedAt && user.expiresIn) {
        return new Date(user.obtainedAt + user.expiresIn * 1000).toISOString();
    }
    return null;
}

function hydrateUserFromRow(row: Record<string, unknown>): StoredUser {
    const tokenExpiresAt = row.token_expires_at
        ? new Date(row.token_expires_at as string).getTime()
        : undefined;

    return {
        userId: row.user_id as string,
        login: row.login as string,
        displayName: row.display_name as string,
        accessToken: (row.access_token as string) ?? '',
        refreshToken: (row.refresh_token as string) ?? '',
        expiresIn: 0,
        obtainedAt: 0,
        apiKey: (row.api_key as string) ?? undefined,
        isActive: row.is_active as boolean,
        blockedReason: (row.blocked_reason as string) ?? undefined,
        customRateLimit: (row.custom_rate_limit as number) ?? undefined,
        customCacheTtl: (row.custom_cache_ttl as number) ?? undefined,
        role: normalizeUserRole(row.role as string | undefined),
        profileImageUrl: (row.profile_image_url as string) ?? undefined,
        timezone: (row.timezone as string) ?? 'UTC',
        lastActive: (row.last_active as string) ?? undefined,
        createdAt: (row.created_at as string) ?? undefined,
        tokenExpiresAt
    };
}

function rememberUserCaches(user: StoredUser): void {
    setUserTimezone(user.userId, user.timezone);
    userMemoryCache.set(user.userId, {
        user,
        expiry: Date.now() + CACHE_TTL_MATRIX.API_USER.default * 1000
    });
}

// Convierte una fila de Supabase al tipo StoredUser de la aplicación
function fromRow(row: Record<string, unknown>): StoredUser {
    return hydrateUserFromRow(row);
}

export type SaveUserOptions = {
    /** Persiste tokens sin invalidar cachés de apiKey/login (refresh OAuth). */
    tokensOnly?: boolean;
};

export const saveUser = async (user: StoredUser, options?: SaveUserOptions): Promise<void> => {
    // Clonamos sin modificar el objeto original
    const secureUser = { ...user };
    if (secureUser.isActive === undefined) secureUser.isActive = true;

    // Solo ciframos si el token NO está ya cifrado (contiene ':' que usa el formato iv:encrypted)
    if (secureUser.accessToken && !isAlreadyEncrypted(secureUser.accessToken)) {
        secureUser.accessToken = encrypt(secureUser.accessToken);
    }
    if (secureUser.refreshToken && !isAlreadyEncrypted(secureUser.refreshToken)) {
        secureUser.refreshToken = encrypt(secureUser.refreshToken);
    }

    const { error } = await supabase
        .from('users')
        .upsert(toRow(secureUser), { onConflict: 'user_id' });

    if (error) {
        logger.error('Error guardando usuario en Supabase:', error.message);
        throw error;
    }

    if (options?.tokensOnly) {
        rememberUserCaches(secureUser);
        await cacheService
            .set(`cache:user:id:${user.userId}`, secureUser, CACHE_TTL_MATRIX.API_USER.default)
            .catch((e) => logger.error('Error actualizando caché de usuario (tokens):', e));
        return;
    }

    const cachePromises = [
        cacheService.del(`cache:user:id:${user.userId}`),
        cacheService.del(`cache:user:login:${user.login.toLowerCase()}`)
    ];

    if (user.apiKey) {
        cachePromises.push(cacheService.invalidateApiKeyCache(user.apiKey));
    }

    await Promise.all(cachePromises).catch((e) =>
        logger.error('Error invalidando caché de usuario:', e)
    );
    invalidateUserMemoryCache(user.userId);
};

export const getUser = async (userId: string): Promise<StoredUser | null> => {
    const memoryHit = userMemoryCache.get(userId);
    if (memoryHit && memoryHit.expiry > Date.now()) {
        return memoryHit.user;
    }
    if (memoryHit) userMemoryCache.delete(userId);

    const inFlight = pendingGetUser.get(userId);
    if (inFlight) return inFlight;

    const fetchPromise = (async (): Promise<StoredUser | null> => {
        const cacheKey = `cache:user:id:${userId}`;
        const cached = await cacheService.get<StoredUser>(cacheKey);
        if (cached) {
            rememberUserCaches(cached);
            return cached;
        }

        const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();

        if (error || !data) return null;

        const user = fromRow(data as Record<string, unknown>);
        const result = await decryptAndMigrateIfNeeded(user, `usuario ${userId}`);
        if (!result) return null;

        rememberUserCaches(result);

        // 10 min: suficiente para no re-consultar Supabase en cada comando del bot
        await cacheService.set(cacheKey, result, CACHE_TTL_MATRIX.API_USER.default);
        return result;
    })();

    pendingGetUser.set(userId, fetchPromise);
    try {
        return await fetchPromise;
    } finally {
        pendingGetUser.delete(userId);
    }
};

export const getUserByLogin = async (login: string): Promise<StoredUser | null> => {
    const normalizedLogin = login.toLowerCase();
    const cacheKey = `cache:user:login:${normalizedLogin}`;

    const cached = await cacheService.get<StoredUser>(cacheKey);
    if (cached) {
        rememberUserCaches(cached);
        return cached;
    }

    const { data } = await supabase.from('users').select('*').eq('login', login).single();
    if (!data) return null;

    const user = fromRow(data as Record<string, unknown>);
    const result = await decryptAndMigrateIfNeeded(user, `login ${login}`);
    if (!result) return null;

    rememberUserCaches(result);

    await cacheService.set(cacheKey, result, CACHE_TTL_MATRIX.USER_BY_LOGIN.default);
    return result;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const clean = apiKey.replace(/-/g, '');
    const normalizedKey =
        clean.length === 32
            ? `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`
            : apiKey;

    const lookupKeys = normalizedKey === apiKey ? [normalizedKey] : [normalizedKey, apiKey];

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('api_key', lookupKeys)
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;

    const user = fromRow(data as Record<string, unknown>);

    if (user.isActive === false) {
        logger.warn(`🛑 Blocked user attempted access: ${user.login}`);
        return null;
    }

    const result = await decryptAndMigrateIfNeeded(user, `api_key ${apiKey}`);
    if (!result) return null;

    rememberUserCaches(result);

    return result;
};

export const updateLastActive = async (userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) logger.error('Error actualizando last_active:', error.message);
    } catch (e) {
        logger.error('Error updating last active:', e);
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const user = await getUser(userId);
        if (!user) return;

        logger.info(`🗑️ Eliminando datos de usuario: ${user.login} (${userId})`);

        const tables = ['user_stats', 'user_daily_stats', 'activity_logs', 'audit_logs'] as const;
        for (const table of tables) {
            const { error } = await supabase.from(table).delete().eq('user_id', userId);
            if (error) {
                logger.error(`Error eliminando ${table} para ${userId}:`, error.message);
                throw error;
            }
        }

        const { error } = await supabase.from('users').delete().eq('user_id', userId);

        if (error) throw error;

        await Promise.all([
            cacheService.del(`cache:user:id:${userId}`),
            cacheService.del(`cache:user:login:${user.login.toLowerCase()}`)
        ]).catch(() => {});

        await invalidateAllUserCaches(userId, {
            apiKey: user.apiKey,
            login: user.login,
            revokeApiKey: true
        });

        logger.info(`🗑️ Usuario eliminado por completo: ${user.login} (${userId})`);
    } catch (e) {
        logger.error('Error deleting user:', e);
        throw e;
    }
};

export const updateUserTimezone = async (userId: string, timezone: string): Promise<void> => {
    const { error } = await supabase.from('users').update({ timezone }).eq('user_id', userId);

    if (error) {
        throw new Error('Error updating timezone');
    }

    const memUser = userMemoryCache.get(userId)?.user;
    setUserTimezone(userId, timezone);
    await invalidateAllUserCaches(userId, { login: memUser?.login });
};
