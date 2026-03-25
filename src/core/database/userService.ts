import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { StoredUser } from '../../types/twitch';
import { encrypt, decrypt, ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY } from './cryptoService';
import { clearUserStatsAndLogs } from './statsService';
import { logger } from '../utils/logger';
import { USERS_KEY, API_KEYS_KEY } from './keys';

export { USERS_KEY, API_KEYS_KEY };

export const saveUser = async (user: StoredUser): Promise<void> => {
    const secureUser = { ...user };
    // Por defecto isActive a true si no está presente
    if (secureUser.isActive === undefined) secureUser.isActive = true;

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

    let needsMigration = false;

    const decryptWithFallback = (text: string): string => {
        try {
            return decrypt(text, ENCRYPTION_KEY);
        } catch (_e) {
            try {
                const decrypted = decrypt(text, LEGACY_ENCRYPTION_KEY);
                needsMigration = true;
                return decrypted;
            } catch (_e2) {
                logger.error(`❌ Fallo crítico de descifrado para usuario ${userId}`);
                throw _e;
            }
        }
    };

    try {
        if (user.accessToken) user.accessToken = decryptWithFallback(user.accessToken);
        if (user.refreshToken) user.refreshToken = decryptWithFallback(user.refreshToken);
    } catch (e) {
        logger.error(`⚠️ Error en descifrado para ${userId}:`, (e as Error).message);
    }

    if (needsMigration) {
        logger.info(`🔄 Migrando claves de cifrado para usuario: ${user.login} (${userId})`);
        await saveUser(user);
    }

    return user;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const cachedUserId = await kv.hget<string>(API_KEYS_KEY, apiKey);
    if (!cachedUserId) return null;

    const user = await getUser(cachedUserId);
    if (!user) return null;

    if (user.isActive === false) {
        logger.warn(`🛑 Blocked user attempted access: ${user.login}`);
        return null; // Denegar acceso implícitamente retornando null
    }

    return user;
};

export const updateLastActive = async (userId: string): Promise<void> => {
    try {
        const user = await kv.hget<StoredUser>(USERS_KEY, userId);
        if (user) {
            user.lastActive = new Date().toISOString();
            await kv.hset(USERS_KEY, { [userId]: user });
        }
    } catch (e) {
        logger.error('Error updating last active:', e);
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const user = await getUser(userId);
        if (!user) return;

        // 1. Borrar objeto principal
        await kv.hdel(USERS_KEY, userId);

        // 2. Borrar mapeo de API Key
        if (user.apiKey) {
            await kv.hdel(API_KEYS_KEY, user.apiKey);
        }

        // 3. Borrar rastro de estadísticas y actividad
        await clearUserStatsAndLogs(userId);

        logger.info(`🗑️ Usuario eliminado por completo: ${user.login} (${userId})`);
    } catch (e) {
        logger.error('Error deleting user:', e);
        throw e;
    }
};

export const resetUserApiKey = async (userId: string): Promise<string> => {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    const oldKey = user.apiKey;
    const newKey = crypto.randomUUID();
    user.apiKey = newKey;

    await saveUser(user);

    if (oldKey) {
        await kv.hdel(API_KEYS_KEY, oldKey);
    }
    await kv.hset(API_KEYS_KEY, { [newKey]: user.userId });

    return newKey;
};
