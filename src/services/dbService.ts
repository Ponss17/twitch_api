import { kv } from '@vercel/kv';
import { StoredUser } from '../types/twitch';
import crypto from 'crypto';
import { CONFIG } from '../config/env';

const USERS_KEY = 'twitch_users';
const API_KEYS_KEY = 'twitch_api_keys';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(CONFIG.TWITCH_CLIENT_SECRET)).digest();
const IV_LENGTH = 16;

function encrypt(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error('Error encrypting:', e);
        return text;
    }
}

function decrypt(text: string): string {
    if (!text) return text;
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        return text;
    }
}

export const saveUser = async (user: StoredUser): Promise<void> => {
    const secureUser = { ...user };
    if (secureUser.accessToken) secureUser.accessToken = encrypt(secureUser.accessToken);
    if (secureUser.refreshToken) secureUser.refreshToken = encrypt(secureUser.refreshToken);

    await kv.hset(USERS_KEY, { [user.userId]: secureUser });

    if (user.apiKey) {
        await kv.hset(API_KEYS_KEY, { [user.apiKey]: user.userId });
    }
};

export const getUser = async (userId: string): Promise<StoredUser | null> => {
    const user = await kv.hget<StoredUser>(USERS_KEY, userId);
    if (!user) return null;

    if (user.accessToken) user.accessToken = decrypt(user.accessToken);
    if (user.refreshToken) user.refreshToken = decrypt(user.refreshToken);

    return user;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const cachedUserId = await kv.hget<string>(API_KEYS_KEY, apiKey);

    if (cachedUserId) {
        return getUser(cachedUserId);
    }

    const allUsers = await kv.hgetall<Record<string, StoredUser>>(USERS_KEY);
    if (!allUsers) return null;

    const foundUser = Object.values(allUsers).find(u => u.apiKey === apiKey);

    if (foundUser) {
        await kv.hset(API_KEYS_KEY, { [apiKey]: foundUser.userId });
    }

    return foundUser || null;
};

export const incrementUsage = async (command: string): Promise<void> => {
    try {
        const key = `stats:usage:${command}`;
        await kv.incr(key);
    } catch (e) {
        console.error('Error incrementing stats:', e);
    }
};

export const getUsageStats = async (): Promise<Record<string, number>> => {
    try {
        const [clips, followage] = await Promise.all([
            kv.get<string>('stats:usage:clip'),
            kv.get<string>('stats:usage:followage')
        ]);
        return {
            clips: parseInt(clips || '0'),
            followage: parseInt(followage || '0')
        };
    } catch (e) {
        return { clips: 0, followage: 0 };
    }
};
