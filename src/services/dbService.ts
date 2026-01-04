import { kv } from '@vercel/kv';
import { StoredUser } from '../types/twitch';

const USERS_KEY = 'twitch_users';

export const saveUser = async (user: StoredUser): Promise<void> => {
    await kv.hset(USERS_KEY, { [user.userId]: user });
};

export const getUser = async (userId: string): Promise<StoredUser | null> => {
    const user = await kv.hget<StoredUser>(USERS_KEY, userId);
    return user || null;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const allUsers = await kv.hgetall<Record<string, StoredUser>>(USERS_KEY);
    if (!allUsers) return null;

    return Object.values(allUsers).find(u => u.apiKey === apiKey) || null;
};
