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
import { logger } from '../utils/logger';
import { setUserTimezone } from './userTimezoneCache';
import {
    apiKeyLookupHash,
    decryptStoredApiKey,
    encryptApiKey,
    normalizeApiKey
} from '../utils/apiKeySecurity';
import {
    fromRow,
    resolveTokenExpiresAtIso,
    userToRow
} from './userRowMapper';
import {
    invalidateUserMemoryCache,
    pendingGetUser,
    rememberUserCaches,
    userMemoryCache
} from './userMemoryCache';

export { invalidateUserMemoryCache } from './userMemoryCache';

const migratedUsersCache = new Set<string>();
const MAX_MIGRATED_CACHE = 500;

const addToMigratedCache = (userId: string) => {
    if (migratedUsersCache.size >= MAX_MIGRATED_CACHE) {
        const first = migratedUsersCache.values().next().value;
        if (first) migratedUsersCache.delete(first);
    }
    migratedUsersCache.add(userId);
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
        if (user.apiKey) {
            const result = decryptStoredApiKey(user.apiKey);
            user.apiKey = result.plaintext;
            needsMigration ||= result.legacy || user.apiKeyHash !== apiKeyLookupHash(result.plaintext);
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

export type SaveUserOptions = {
    /** Persiste tokens sin invalidar cachés de apiKey/login (refresh OAuth). */
    tokensOnly?: boolean;
    /**
     * No escribe role / custom_rate_limit / custom_cache_ttl.
     * Así un plan puesto a mano en Supabase no se pisa en re-login.
     */
    preservePlan?: boolean;
};

function secureUserForL2(user: StoredUser): StoredUser {
    const secure = { ...user };
    if (secure.accessToken && !isAlreadyEncrypted(secure.accessToken)) {
        secure.accessToken = encrypt(secure.accessToken);
    }
    if (secure.refreshToken && !isAlreadyEncrypted(secure.refreshToken)) {
        secure.refreshToken = encrypt(secure.refreshToken);
    }
    if (secure.apiKey) {
        const plaintext = decryptStoredApiKey(secure.apiKey).plaintext;
        secure.apiKeyHash = apiKeyLookupHash(plaintext);
        secure.apiKey = encryptApiKey(plaintext);
    }
    return secure;
}

/** Garantiza secretos en claro solo al servirlos dentro del proceso. */
async function ensurePlaintextUser(user: StoredUser, context: string): Promise<StoredUser | null> {
    if (
        !isAlreadyEncrypted(user.accessToken) &&
        !isAlreadyEncrypted(user.refreshToken) &&
        (!user.apiKey || !isAlreadyEncrypted(user.apiKey))
    ) {
        return user;
    }
    return decryptAndMigrateIfNeeded(user, context);
}

export const saveUser = async (user: StoredUser, options?: SaveUserOptions): Promise<void> => {
    const secureUser = { ...user };
    if (secureUser.isActive === undefined) secureUser.isActive = true;

    if (secureUser.accessToken && !isAlreadyEncrypted(secureUser.accessToken)) {
        secureUser.accessToken = encrypt(secureUser.accessToken);
    }
    if (secureUser.refreshToken && !isAlreadyEncrypted(secureUser.refreshToken)) {
        secureUser.refreshToken = encrypt(secureUser.refreshToken);
    }
    if (secureUser.apiKey) {
        const plaintext = decryptStoredApiKey(secureUser.apiKey).plaintext;
        secureUser.apiKeyHash = apiKeyLookupHash(plaintext);
        secureUser.apiKey = encryptApiKey(plaintext);
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

        await Promise.all([
            cacheService.del(`cache:user:id:${user.userId}`),
            cacheService.del(`cache:user:login:${user.login.toLowerCase()}`)
        ]).catch((e) => logger.error('Error invalidando caché tras tokensOnly:', e));
        invalidateUserMemoryCache(user.userId);
        const { invalidateAuthCache } = await import('../middleware/authMiddleware');
        invalidateAuthCache(user.userId, { revokeSession: false });
        return;
    }

    const { error } = await supabase
        .from('users')
        .upsert(userToRow(secureUser, { preservePlan: options?.preservePlan }), {
            onConflict: 'user_id'
        });

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

export const getUser = async (
    userId: string,
    options?: { bypassCache?: boolean }
): Promise<StoredUser | null> => {
    if (!options?.bypassCache) {
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
    } else {
        invalidateUserMemoryCache(userId);
        await cacheService.del(`cache:user:id:${userId}`).catch(() => {});
    }

    const fetchPromise = (async (): Promise<StoredUser | null> => {
        if (!options?.bypassCache) {
            const cacheKey = `cache:user:id:${userId}`;
            const cached = await cacheService.get<StoredUser>(cacheKey);
            if (cached) {
                const plain = await ensurePlaintextUser(cached, `caché ${userId}`);
                if (!plain) return null;
                rememberUserCaches(plain);
                await cacheService
                    .set(cacheKey, secureUserForL2(plain), CACHE_TTL_MATRIX.API_USER.default)
                    .catch((e) => logger.error('Error reescribiendo caché de usuario:', e));
                return plain;
            }
        }

        const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();

        if (error || !data) return null;

        const user = fromRow(data as Record<string, unknown>);
        const result = await decryptAndMigrateIfNeeded(user, `usuario ${userId}`);
        if (!result) return null;

        rememberUserCaches(result);

        await cacheService.set(
            `cache:user:id:${userId}`,
            secureUserForL2(result),
            CACHE_TTL_MATRIX.API_USER.default
        );
        return result;
    })();

    if (!options?.bypassCache) {
        pendingGetUser.set(userId, fetchPromise);
    }
    try {
        return await fetchPromise;
    } finally {
        if (!options?.bypassCache) {
            pendingGetUser.delete(userId);
        }
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
        await cacheService
            .set(cacheKey, secureUserForL2(plain), CACHE_TTL_MATRIX.USER_BY_LOGIN.default)
            .catch((e) => logger.error('Error reescribiendo caché login:', e));
        return plain;
    }

    const { data } = await supabase.from('users').select('*').eq('login', normalizedLogin).single();
    if (!data) return null;

    const user = fromRow(data as Record<string, unknown>);
    const result = await decryptAndMigrateIfNeeded(user, `login ${login}`);
    if (!result) return null;

    rememberUserCaches(result);

    await cacheService.set(
        cacheKey,
        secureUserForL2(result),
        CACHE_TTL_MATRIX.USER_BY_LOGIN.default
    );
    return result;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const normalizedKey = normalizeApiKey(apiKey);
    const lookupKeys = normalizedKey === apiKey ? [normalizedKey] : [normalizedKey, apiKey];

    let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('api_key_hash', apiKeyLookupHash(normalizedKey))
        .limit(1)
        .maybeSingle();

    if (!data) {
        const legacy = await supabase
            .from('users')
            .select('*')
            .in('api_key', lookupKeys)
            .limit(1)
            .maybeSingle();
        data = legacy.data;
        error = legacy.error;
    }

    if (error || !data) return null;

    const user = fromRow(data as Record<string, unknown>);

    if (user.isActive === false) {
        logger.warn(`🛑 Blocked user attempted access: ${user.login}`);
        return null;
    }

    const result = await decryptAndMigrateIfNeeded(user, `api_key hash ${apiKeyLookupHash(apiKey)}`);
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

        const { error: questionsError } = await supabase
            .from('streamer_questions')
            .delete()
            .eq('user_id', userId);
        if (questionsError) {
            logger.warn(
                `streamer_questions wipe skipped for ${userId}:`,
                questionsError.message
            );
        }

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
