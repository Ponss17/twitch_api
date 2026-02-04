import { kv } from '@vercel/kv';

export const get = async (key: string): Promise<unknown | null> => {
    return await kv.get(key);
};

export const set = async (key: string, value: unknown, ttlSeconds: number = 60): Promise<void> => {
    await kv.set(key, value, { ex: ttlSeconds });
};

export const getCachedUserId = async (username: string): Promise<string | null> => {
    const value = await get(`cache:userId:${username.toLowerCase()}`);
    return typeof value === 'string' ? value : null;
};

export const setCachedUserId = async (username: string, id: string): Promise<void> => {
    await set(`cache:userId:${username.toLowerCase()}`, id, 24 * 60 * 60);
};
