import { kv } from '@vercel/kv';

type CacheEntry<T> = { value: T; expiry: number };

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const DEFAULT_L1_TTL_MS = 30 * 1000;

const getL1 = <T>(key: string): T | null => {
    const cached = MEMORY_CACHE.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiry > Date.now()) {
        return cached.value;
    }
    if (cached) MEMORY_CACHE.delete(key);
    return null;
};

const setL1 = <T>(key: string, value: T, ttlMs: number = DEFAULT_L1_TTL_MS): void => {
    MEMORY_CACHE.set(key, { value, expiry: Date.now() + ttlMs });
};

export const get = async <T = unknown>(key: string): Promise<T | null> => {
    const l1Value = getL1<T>(key);
    if (l1Value !== null) return l1Value;

    const value = await kv.get<T>(key);
    if (value !== null) setL1<T>(key, value);
    return value;
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
    await kv.del(key);
};

export const getCachedUserId = async (username: string): Promise<string | null> => {
    const key = `cache:userId:${username.toLowerCase()}`;
    return get<string>(key);
};

export const setCachedUserId = async (username: string, id: string): Promise<void> => {
    await set(`cache:userId:${username.toLowerCase()}`, id, 24 * 60 * 60);
};
