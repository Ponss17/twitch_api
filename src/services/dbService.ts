import { kv } from '@vercel/kv';
import { StoredUser } from '../types/twitch';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/env';

// ==========================================
// Constantes y Configuración
// ==========================================

const USERS_KEY = 'twitch_users';
const API_KEYS_KEY = 'twitch_api_keys';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(CONFIG.TWITCH_CLIENT_SECRET)).digest();
const IV_LENGTH = 16;

// ==========================================
// Ayudantes de Criptografía (Seguridad)
// ==========================================

function encrypt(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        logger.error('Error encrypting:', e);
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

// ==========================================
// Gestión de Usuarios y Auth
// ==========================================

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
    if (!cachedUserId) return null;
    return getUser(cachedUserId);
};

// ==========================================
// Estadísticas (Por Usuario)
// ==========================================

export const incrementUserStats = async (userId: string, command: string): Promise<void> => {
    try {
        await kv.hincrby(`stats:${userId}`, command, 1);
    } catch (e) {
        logger.error('Error incrementing user stats:', e);
    }
};

export const getUserStats = async (userId: string): Promise<Record<string, number>> => {
    try {
        const key = `stats:${userId}`;
        const stats = await kv.hgetall(key);

        if (!stats) return { clips: 0, followage: 0, so: 0 };

        const numericStats: Record<string, number> = {
            clips: 0,
            followage: 0,
            so: 0
        };

        for (const [key, value] of Object.entries(stats)) {
            numericStats[key] = parseInt(value as string) || 0;
        }

        return numericStats;
    } catch (e) {
        logger.error('Error getting user stats:', e);
        return { clips: 0, followage: 0, so: 0 };
    }
};
