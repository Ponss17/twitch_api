import { kv } from './redisClient';
import { StoredUser } from '../../types/twitch';
import { CACHE_TTL_MATRIX, ownerScopedCacheKey } from '../config/cacheTtl';

/** Metadatos cacheables sin tokens OAuth (resolver con getUser en apiKeyValidator). */
export type CachedApiUserMeta = Pick<
    StoredUser,
    'userId' | 'login' | 'displayName' | 'apiKey' | 'isActive' | 'profileImageUrl' | 'customRateLimit' | 'customCacheTtl' | 'role'
>;

let kvWritesDisabled = false;

function disableKvWrites(reason: string): void {
    if (kvWritesDisabled) return;
    kvWritesDisabled = true;
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Cache] KV escritura deshabilitada en dev (${reason}). Solo caché L1 en memoria.`);
    }
}

/** En dev, false si el token KV es read-only o falló una escritura. */
export function isKvWriteAvailable(): boolean {
    if (process.env.NODE_ENV === 'production') return true;
    return !kvWritesDisabled;
}

(function initKvDevMode(): void {
    if (process.env.NODE_ENV === 'production') return;
    const token = process.env.KV_REST_API_TOKEN?.trim();
    const readOnly = process.env.KV_REST_API_READ_ONLY_TOKEN?.trim();
    if (token && readOnly && token === readOnly) {
        disableKvWrites('KV_REST_API_TOKEN coincide con el token read-only');
    }
})();

export const get = async <T = unknown>(key: string): Promise<T | null> => {
    try {
        const value = await kv.get<T>(`twitch_api:${key}`);
        return value;
    } catch (error) {
        console.error(`[Cache] Error KV get (${key}):`, error);
        return null; // Fail-soft: devolver null para que el sistema consulte la DB original
    }
};

export const set = async <T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number = 60
): Promise<void> => {
    if (!isKvWriteAvailable()) return;
    try {
        await kv.set(`twitch_api:${key}`, value, { ex: ttlSeconds });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            disableKvWrites('KV no permite escritura');
            return;
        }
        console.error(`[Cache] Error KV set (${key}):`, error);
    }
};

/**
 * SET NX — resultado del intento de escritura atómica.
 * - acquired: esta instancia ganó el write
 * - exists: la clave ya existía (replay / otro worker)
 * - unavailable: KV no escribible o error transitorio
 */
export type SetIfAbsentResult = 'acquired' | 'exists' | 'unavailable';

export const setIfAbsent = async <T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number = 60
): Promise<SetIfAbsentResult> => {
    if (!isKvWriteAvailable()) {
        return 'unavailable';
    }

    try {
        const result = await kv.set(`twitch_api:${key}`, value, {
            nx: true,
            ex: ttlSeconds
        });
        if (result === null || result === undefined) {
            return 'exists';
        }
        return 'acquired';
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            disableKvWrites('KV no permite escritura');
            return 'unavailable';
        }
        console.error(`[Cache] Error KV setIfAbsent (${key}):`, error);
        return 'unavailable';
    }
};

export const del = async (key: string): Promise<void> => {
    if (!isKvWriteAvailable()) return;
    try {
        await kv.del(`twitch_api:${key}`);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            disableKvWrites('KV no permite escritura');
            return;
        }
        console.error(`[Cache] Error KV del (${key}):`, error);
    }
};

export const getCachedUserId = async (username: string): Promise<string | null> => {
    const key = `cache:userId:${username.toLowerCase()}`;
    return get<string>(key);
};

export const setCachedUserId = async (username: string, id: string): Promise<void> => {
    await set(`cache:userId:${username.toLowerCase()}`, id, CACHE_TTL_MATRIX.TWITCH_USER_ID.default);
};

export const getCachedApiUserMeta = async (apiKey: string): Promise<CachedApiUserMeta | null> => {
    const key = `cache:apiuser:${apiKey}`;
    return get<CachedApiUserMeta>(key);
};

/** @deprecated Usar getCachedApiUserMeta + getUser para no cachear tokens en KV. */
export const getCachedApiUser = async (apiKey: string): Promise<StoredUser | null> => {
    return getCachedApiUserMeta(apiKey) as Promise<StoredUser | null>;
};

export const setCachedApiUser = async (apiKey: string, user: StoredUser): Promise<void> => {
    const meta: CachedApiUserMeta = {
        userId: user.userId,
        login: user.login,
        displayName: user.displayName,
        apiKey: user.apiKey,
        isActive: user.isActive,
        profileImageUrl: user.profileImageUrl,
        customRateLimit: user.customRateLimit,
        customCacheTtl: user.customCacheTtl,
        role: user.role
    };
    await set(`cache:apiuser:${apiKey}`, meta, CACHE_TTL_MATRIX.API_USER.default);
};

/** Invalida caché del dashboard tras borrar datos, eliminar cuenta, etc. */
export const statsRevisionKey = (userId: string): string => `cache:stats:rev:${userId}`;

/** Marca stats invalidadas en KV — todas las réplicas serverless respetan la revisión. */
export const bumpStatsRevision = async (userId: string): Promise<void> => {
    await set(statsRevisionKey(userId), Date.now(), 300);
};

export const getStatsRevision = async (userId: string): Promise<number> => {
    try {
        const value = await kv.get<number>(`twitch_api:${statsRevisionKey(userId)}`);
        return typeof value === 'number' ? value : 0;
    } catch {
        return 0;
    }
};

export const invalidateDashboardCache = async (
    userId: string,
    login?: string
): Promise<void> => {
    const keys = [
        `cache:dashboard:profile:${userId}`,
        `cache:dashboard:analytics:${userId}`,
        `cache:analytics:${userId}`,
        `cache:activity:${userId}`
    ];

    if (login) {
        keys.push(
            ownerScopedCacheKey(userId, `cache:cmd:getUserInfo:login:${login.toLowerCase()}`)
        );
    }

    await Promise.all(keys.map((key) => del(key))).catch(() => {});
};

/** Solo analytics (tras incremento de comando — sin tocar perfil). */
export const invalidateDashboardAnalytics = async (userId: string): Promise<void> => {
    await Promise.all([
        del(`cache:dashboard:analytics:${userId}`),
        del(`cache:analytics:${userId}`)
    ]).catch(() => {});
};

/** Réplicas serverless rechazan la clave antigua tras regenerar (TTL = API_USER). */
export const revokeApiKeyGlobally = async (apiKey: string): Promise<void> => {
    const normalized = apiKey.trim().toLowerCase();
    if (!normalized) return;
    await set(`cache:apikey:revoked:${normalized}`, 1, CACHE_TTL_MATRIX.API_USER.default);
};

export const isApiKeyRevoked = async (apiKey: string): Promise<boolean> => {
    const normalized = apiKey.trim().toLowerCase();
    if (!normalized) return false;
    const flag = await get<number>(`cache:apikey:revoked:${normalized}`);
    return flag !== null;
};

/** Quita revocación KV (p. ej. flag obsoleto tras clear-data antes del fix). */
export const clearApiKeyRevocation = async (apiKey: string): Promise<void> => {
    const normalized = apiKey.trim().toLowerCase();
    if (!normalized) return;
    if (!isKvWriteAvailable()) return;
    try {
        await kv.del(`twitch_api:cache:apikey:revoked:${normalized}`);
    } catch {
        /* ignore */
    }
};

export const invalidateApiKeyCache = async (apiKey: string): Promise<void> => {
    if (!isKvWriteAvailable()) return;
    try {
        await kv.del(`twitch_api:cache:apiuser:${apiKey}`);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            disableKvWrites('KV no permite escritura');
            return;
        }
        console.error(`[Cache] Error KV del apiuser (${apiKey}):`, error);
    }
};
