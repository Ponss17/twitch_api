import { kv } from '@vercel/kv';
import { StoredUser } from '../../types/twitch';
import { CacheEntry } from '../../types/cache';
import { CACHE_TTL } from '../config/cacheTtl';

/** Metadatos cacheables sin tokens OAuth (resolver con getUser en apiKeyValidator). */
export type CachedApiUserMeta = Pick<
    StoredUser,
    'userId' | 'login' | 'displayName' | 'apiKey' | 'isActive' | 'profileImageUrl' | 'customRateLimit'
>;

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const DEFAULT_L1_TTL_MS = 30 * 1000;
const MAX_MEMORY_CACHE_SIZE = 500;

/** Alinea TTL de L1 con el de KV para evitar re-lecturas prematuras a Redis. */
function resolveL1TtlMs(key: string): number {
    if (key.startsWith('cache:user:id:') || key.startsWith('cache:apiuser:')) {
        return CACHE_TTL.API_USER * 1000;
    }
    if (key.startsWith('cache:user:login:')) {
        return CACHE_TTL.USER_BY_LOGIN * 1000;
    }
    if (key.startsWith('cache:dashboard:profile:')) {
        return CACHE_TTL.DASHBOARD_PROFILE * 1000;
    }
    if (key.startsWith('cache:dashboard:analytics:') || key.startsWith('cache:analytics:')) {
        return CACHE_TTL.DASHBOARD_ANALYTICS * 1000;
    }
    if (key.startsWith('cache:activity:')) {
        return CACHE_TTL.ACTIVITY_FEED * 1000;
    }
    if (key.startsWith('cache:cmd:getUserInfo:login:')) {
        return CACHE_TTL.USER_INFO * 1000;
    }
    if (key.startsWith('cache:userId:')) {
        return CACHE_TTL.TWITCH_USER_ID * 1000;
    }
    return DEFAULT_L1_TTL_MS;
}

const evictMemoryCache = (): void => {
    const toRemove = Math.floor(MAX_MEMORY_CACHE_SIZE * 0.25);
    const iterator = MEMORY_CACHE.keys();
    for (let i = 0; i < toRemove; i++) {
        const key = iterator.next().value;
        if (key) MEMORY_CACHE.delete(key);
    }
};

const getL1 = <T>(key: string): T | null => {
    const cached = MEMORY_CACHE.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiry > Date.now()) {
        return cached.value;
    }
    if (cached) MEMORY_CACHE.delete(key);
    return null;
};

const setL1 = <T>(key: string, value: T, ttlMs: number = DEFAULT_L1_TTL_MS): void => {
    if (MEMORY_CACHE.size >= MAX_MEMORY_CACHE_SIZE) {
        evictMemoryCache();
    }
    MEMORY_CACHE.set(key, { value, expiry: Date.now() + ttlMs });
};

const pendingKVRequests = new Map<string, Promise<unknown>>();
const MAX_PENDING_SIZE = 500;

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
    const l1Value = getL1<T>(key);
    if (l1Value !== null) return l1Value;

    if (pendingKVRequests.has(key)) {
        return pendingKVRequests.get(key) as Promise<T | null>;
    }

    if (pendingKVRequests.size >= MAX_PENDING_SIZE) {
        const first = pendingKVRequests.keys().next().value;
        if (first) pendingKVRequests.delete(first);
    }

    const fetchPromise = (async () => {
        try {
            const value = await kv.get<T>(`twitch_api:${key}`);
            if (value !== null) setL1<T>(key, value, resolveL1TtlMs(key));
            return value;
        } catch (error) {
            console.error(`[Cache] Error KV get (${key}):`, error);
            return null; // Fail-soft: devolver null para que el sistema consulte la DB original
        } finally {
            pendingKVRequests.delete(key);
        }
    })();

    pendingKVRequests.set(key, fetchPromise);
    return fetchPromise;
};

export const set = async <T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number = 60
): Promise<void> => {
    setL1<T>(key, value, ttlSeconds * 1000);
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

export const del = async (key: string): Promise<void> => {
    MEMORY_CACHE.delete(key);
    pendingKVRequests.delete(key);
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
    await set(`cache:userId:${username.toLowerCase()}`, id, CACHE_TTL.TWITCH_USER_ID);
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
        customRateLimit: user.customRateLimit
    };
    await set(`cache:apiuser:${apiKey}`, meta, CACHE_TTL.API_USER);
};

/** Invalida caché del dashboard tras borrar datos, eliminar cuenta, etc. */
export const statsRevisionKey = (userId: string): string => `cache:stats:rev:${userId}`;

/** Marca stats invalidadas en KV — todas las réplicas serverless respetan la revisión. */
export const bumpStatsRevision = async (userId: string): Promise<void> => {
    await set(statsRevisionKey(userId), Date.now(), 300);
};

export const getStatsRevision = async (userId: string): Promise<number> => {
    const value = await get<number>(statsRevisionKey(userId));
    return typeof value === 'number' ? value : 0;
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
        keys.push(`cache:cmd:getUserInfo:login:${login.toLowerCase()}`);
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
    await set(`cache:apikey:revoked:${normalized}`, 1, CACHE_TTL.API_USER);
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
    MEMORY_CACHE.delete(`cache:apikey:revoked:${normalized}`);
    if (!isKvWriteAvailable()) return;
    try {
        await kv.del(`twitch_api:cache:apikey:revoked:${normalized}`);
    } catch {
        /* ignore */
    }
};

export const invalidateApiKeyCache = async (apiKey: string): Promise<void> => {
    MEMORY_CACHE.delete(`cache:apiuser:${apiKey}`);
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
