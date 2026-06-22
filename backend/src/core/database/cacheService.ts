import { kv } from '@vercel/kv';
import { StoredUser } from '../../types/twitch';
import { CacheEntry } from '../../types/cache';

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const DEFAULT_L1_TTL_MS = 30 * 1000;
const MAX_MEMORY_CACHE_SIZE = 500;

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
            if (value !== null) setL1<T>(key, value);
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
    await set(`cache:userId:${username.toLowerCase()}`, id, 24 * 60 * 60);
};

// TTL de 10 min en KV (Redis): comparte el usuario entre instancias serverless.
// Sin esto, cada nueva función fría consultaría Supabase en el primer comando del bot.
const API_USER_CACHE_TTL_S = 10 * 60; // 600s

export const getCachedApiUser = async (apiKey: string): Promise<StoredUser | null> => {
    const key = `cache:apiuser:${apiKey}`;
    return get<StoredUser>(key);
};

export const setCachedApiUser = async (apiKey: string, user: StoredUser): Promise<void> => {
    await set(`cache:apiuser:${apiKey}`, user, API_USER_CACHE_TTL_S);
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
