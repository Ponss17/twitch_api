import { kv } from '@vercel/kv';

// Caché L1 en memoria para reducir llamadas a Redis en ejecuciones "calientes"
const MEMORY_CACHE = new Map<string, { value: any; expiry: number }>();
const DEFAULT_L1_TTL_MS = 30 * 1000; // 30 segundos para L1

const getL1 = (key: string): any | null => {
    const cached = MEMORY_CACHE.get(key);
    if (cached && cached.expiry > Date.now()) {
        return cached.value;
    }
    if (cached) MEMORY_CACHE.delete(key);
    return null;
};

const setL1 = (key: string, value: any, ttlMs: number = DEFAULT_L1_TTL_MS): void => {
    MEMORY_CACHE.set(key, { value, expiry: Date.now() + ttlMs });
};

export const get = async (key: string): Promise<unknown | null> => {
    const l1Value = getL1(key);
    if (l1Value !== null) return l1Value;

    const value = await kv.get(key);
    if (value !== null) setL1(key, value);
    return value;
};

export const set = async (key: string, value: unknown, ttlSeconds: number = 60): Promise<void> => {
    setL1(key, value, ttlSeconds * 1000);
    await kv.set(key, value, { ex: ttlSeconds });
};

export const del = async (key: string): Promise<void> => {
    MEMORY_CACHE.delete(key);
    await kv.del(key);
};

export const getCachedUserId = async (username: string): Promise<string | null> => {
    const key = `cache:userId:${username.toLowerCase()}`;
    const value = await get(key);
    return typeof value === 'string' ? value : null;
};

export const setCachedUserId = async (username: string, id: string): Promise<void> => {
    await set(`cache:userId:${username.toLowerCase()}`, id, 24 * 60 * 60);
};
