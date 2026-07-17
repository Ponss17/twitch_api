import { supabase } from './supabaseClient';
import { StoredUser } from '../../types/twitch';
import {
    encrypt,
    decrypt,
    ENCRYPTION_KEY,
    LEGACY_ENCRYPTION_KEY,
    isCbcFormat
} from './cryptoService';
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
const migratedUsersCache = new Set<string>();
const MAX_MIGRATED_CACHE = 500;

const addToMigratedCache = (userId: string) => {
    if (migratedUsersCache.size >= MAX_MIGRATED_CACHE) {
        const first = migratedUsersCache.values().next().value;
        if (first) migratedUsersCache.delete(first);
    }
    migratedUsersCache.add(userId);
};

export const invalidateUserMemoryCache = (userId: string): void => {
    userMemoryCache.delete(userId);
    pendingGetUser.delete(userId);
    clearUserTimezone(userId);
};



const isAlreadyEncrypted = (val?: string | null) =>
    !!val && (val.startsWith('gcm:') || isCbcFormat(val));

function decryptTokenWithFallback(token: string): { plaintext: string; needsMigration: boolean } {
    const wasCbc = isCbcFormat(token);

    try {
        return { plaintext: decrypt(token, ENCRYPTION_KEY), needsMigration: wasCbc };
    } catch {
        const plaintext = decrypt(token, LEGACY_ENCRYPTION_KEY);
        return { plaintext, needsMigration: true };
    }
}

async function decryptAndMigrateIfNeeded(
    user: StoredUser,
    context: string
): Promise<StoredUser | null> {
    let needsMigration = false;

    try {
        if (user.accessToken) {
            const result = decryptTokenWithFallback(user.accessToken);
            user.accessToken = result.plaintext;
            needsMigration ||= result.needsMigration;
        }
        if (user.refreshToken) {
            const result = decryptTokenWithFallback(user.refreshToken);
            user.refreshToken = result.plaintext;
            needsMigration ||= result.needsMigration;
        }
    } catch (e) {
        logger.error(`O Descifrado fallido para ${context}:`, (e as Error).message);
        return null;
    }

    if (needsMigration && !migratedUsersCache.has(user.userId)) {
        addToMigratedCache(user.userId);
        logger.info(`Migrando tokens legacy a GCM para usuario: ${user.login} (${user.userId})`);
        await saveUser(user).catch((err) => logger.error('Error migrando usuario:', err));
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
        token_expires_at: resolveTokenExpiresAtIso(user),
        discord_id: user.discordId ?? null,
        discord_username: user.discordUsername ?? null,
        discord_avatar: user.discordAvatar ?? null,
        discord_linked_at: user.discordLinkedAt ?? null,
        discord_updated_at: user.discordUpdatedAt ?? null
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
        tokenExpiresAt,
        discordId: (row.discord_id as string) ?? null,
        discordUsername: (row.discord_username as string) ?? null,
        discordAvatar: (row.discord_avatar as string) ?? null,
        discordLinkedAt: (row.discord_linked_at as string) ?? null,
        discordUpdatedAt: (row.discord_updated_at as string) ?? null
    };
}

function rememberUserCaches(user: StoredUser): void {
    setUserTimezone(user.userId, user.timezone);
    userMemoryCache.set(user.userId, {
        user,
        expiry: Date.now() + CACHE_TTL_MATRIX.API_USER.default * 1000
    });
}

/** Garantiza tokens en claro al servir desde caché (evita Bearer gcm:... a Twitch). */
async function ensurePlaintextUser(user: StoredUser, context: string): Promise<StoredUser | null> {
    if (!isAlreadyEncrypted(user.accessToken) && !isAlreadyEncrypted(user.refreshToken)) {
        return user;
    }
    return decryptAndMigrateIfNeeded(user, context);
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

    if (options?.tokensOnly) {
        const { error } = await supabase
            .from('users')
            .update({
                access_token: secureUser.accessToken ?? null,
                refresh_token: secureUser.refreshToken ?? null,
                token_expires_at: resolveTokenExpiresAtIso(secureUser)
            })
            .eq('user_id', user.userId);

        if (error) {
            logger.error('Error actualizando tokens en Supabase:', error.message);
            throw error;
        }

        // DB guarda cifrado; caché L1/KV debe quedar en claro para Helix/auth.
        // Fusionar con caché existente para no perder campos (p. ej. Discord) no cargados en `user`.
        const cacheKey = `cache:user:id:${user.userId}`;
        const cached = await cacheService.get<StoredUser>(cacheKey);
        const merged: StoredUser = {
            ...(cached ?? user),
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            expiresIn: user.expiresIn,
            obtainedAt: user.obtainedAt,
            tokenExpiresAt: user.tokenExpiresAt
        };
        rememberUserCaches(merged);
        await Promise.all([
            cacheService.set(cacheKey, merged, CACHE_TTL_MATRIX.API_USER.default),
            cacheService.set(
                `cache:user:login:${user.login.toLowerCase()}`,
                merged,
                CACHE_TTL_MATRIX.USER_BY_LOGIN.default
            )
        ]).catch((e) => logger.error('Error actualizando caché de usuario (tokens):', e));
        return;
    }

    const { error } = await supabase
        .from('users')
        .upsert(toRow(secureUser), { onConflict: 'user_id' });

    if (error) {
        logger.error('Error guardando usuario en Supabase:', error.message);
        throw error;
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
        const plain = await ensurePlaintextUser(memoryHit.user, `memoria ${userId}`);
        if (!plain) return null;
        if (plain !== memoryHit.user) rememberUserCaches(plain);
        return plain;
    }
    if (memoryHit) userMemoryCache.delete(userId);

    const inFlight = pendingGetUser.get(userId);
    if (inFlight) return inFlight;

    const fetchPromise = (async (): Promise<StoredUser | null> => {
        const cacheKey = `cache:user:id:${userId}`;
        const cached = await cacheService.get<StoredUser>(cacheKey);
        if (cached) {
            const plain = await ensurePlaintextUser(cached, `caché ${userId}`);
            if (!plain) return null;
            rememberUserCaches(plain);
            if (plain !== cached) {
                await cacheService
                    .set(cacheKey, plain, CACHE_TTL_MATRIX.API_USER.default)
                    .catch((e) => logger.error('Error reescribiendo caché de usuario:', e));
            }
            return plain;
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
        const plain = await ensurePlaintextUser(cached, `caché login ${login}`);
        if (!plain) return null;
        rememberUserCaches(plain);
        if (plain !== cached) {
            await cacheService
                .set(cacheKey, plain, CACHE_TTL_MATRIX.USER_BY_LOGIN.default)
                .catch((e) => logger.error('Error reescribiendo caché login:', e));
        }
        return plain;
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

        logger.info(`🚮 Eliminando datos de usuario: ${user.login} (${userId})`);

        const { error } = await supabase.from('users').delete().eq('user_id', userId);

        if (error) {
            logger.error(`Error eliminando users para ${userId}:`, error.message);
            throw error;
        }

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
