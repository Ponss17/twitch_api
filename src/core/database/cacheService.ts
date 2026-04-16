import { kv } from '@vercel/kv';
import { StoredUser } from '../../types/twitch';

type CacheEntry<T> = { value: T; expiry: number };

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

    const fetchPromise = kv
        .get<T>(key)
        .then((value) => {
            if (value !== null) setL1<T>(key, value);
            pendingKVRequests.delete(key);
            return value;
        })
        .catch((error) => {
            pendingKVRequests.delete(key);
            throw error;
        });

    pendingKVRequests.set(key, fetchPromise);
    return fetchPromise;
};

export const set = async <T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number = 60
): Promise<void> => {
    setL1<T>(key, value, ttlSeconds * 1000);
    await kv.set(key, value, { ex: ttlSeconds });
};

export const del = async (key: string): Promise<void> => {
    MEMORY_CACHE.delete(key);
    pendingKVRequests.delete(key);
    await kv.del(key);
};

export const getCachedUserId = async (username: string): Promise<string | null> => {
    const key = `cache:userId:${username.toLowerCase()}`;
    return get<string>(key);
};

export const setCachedUserId = async (username: string, id: string): Promise<void> => {
    await set(`cache:userId:${username.toLowerCase()}`, id, 24 * 60 * 60);
};

const API_USER_CACHE_TTL_S = 60;

export const getCachedApiUser = async (apiKey: string): Promise<StoredUser | null> => {
    const key = `cache:apiuser:${apiKey}`;
    return get<StoredUser>(key);
};

export const setCachedApiUser = async (apiKey: string, user: StoredUser): Promise<void> => {
    await set(`cache:apiuser:${apiKey}`, user, API_USER_CACHE_TTL_S);
};

export const invalidateApiKeyCache = async (apiKey: string): Promise<void> => {
    MEMORY_CACHE.delete(`cache:apiuser:${apiKey}`);
    await kv.del(`cache:apiuser:${apiKey}`);
};
