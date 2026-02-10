import { kv } from '@vercel/kv';
import { StoredUser } from '../../types/twitch';
import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { CONFIG } from '../../config/env';

// ==========================================
// Constantes y Configuración
// ==========================================

const USERS_KEY = 'twitch_users';
const API_KEYS_KEY = 'twitch_api_keys';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto
    .createHash('sha256')
    .update(String(CONFIG.TWITCH_CLIENT_SECRET))
    .digest();
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
    } catch (_error) {
        return text;
    }
}

// ==========================================
// Gestión de Usuarios y Auth
// ==========================================

export const saveUser = async (user: StoredUser): Promise<void> => {
    const secureUser = { ...user };
    // Default isActive to true if not present
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

    if (user.accessToken) user.accessToken = decrypt(user.accessToken);
    if (user.refreshToken) user.refreshToken = decrypt(user.refreshToken);

    return user;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    const cachedUserId = await kv.hget<string>(API_KEYS_KEY, apiKey);
    if (!cachedUserId) return null;

    const user = await getUser(cachedUserId);
    if (!user) return null;

    if (user.isActive === false) {
        logger.warn(`🛑 Blocked user attempted access: ${user.login}`);
        return null; // Implicitly deny access by returning null
    }

    return user;
};

// ==========================================
// Admin Functions
// ==========================================

export const getAllUsers = async (): Promise<StoredUser[]> => {
    try {
        const allUsers = await kv.hgetall<Record<string, StoredUser>>(USERS_KEY);
        if (!allUsers) return [];

        const users = Object.values(allUsers);
        const enhancedUsers = await Promise.all(
            users.map(async (u) => {
                const safeUser = { ...u };
                const safeAnyUser = safeUser as unknown as Record<string, unknown>;
                delete safeAnyUser.accessToken;
                delete safeAnyUser.refreshToken;

                if (safeUser.isActive === undefined) safeUser.isActive = true;

                if (!safeUser.createdAt) {
                    if (safeUser.obtainedAt) {
                        try {
                            safeUser.createdAt = new Date(safeUser.obtainedAt).toISOString();
                        } catch {
                            // Invalid date, ignore
                        }
                    }
                }

                const stats = await getUserStats(u.userId);
                const totalRequests = Object.values(stats).reduce((a, b) => a + b, 0);

                return {
                    ...safeUser,
                    totalRequests,
                    stats
                };
            })
        );

        return enhancedUsers;
    } catch (e: unknown) {
        logger.error('Error getting all users:', e);
        return [];
    }
};

export const updateUserStatus = async (
    userId: string,
    isActive: boolean,
    reason?: string
): Promise<void> => {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    user.isActive = isActive;
    if (reason) user.blockedReason = reason;
    else if (isActive) delete user.blockedReason; // transform to undefined if unblocking

    await saveUser(user);
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

export const updateLastActive = async (userId: string): Promise<void> => {
    try {
        const user = await getUser(userId);
        if (user) {
            user.lastActive = new Date().toISOString();
            await saveUser(user);
        }
    } catch (e) {
        logger.error('Error updating last active:', e);
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const user = await getUser(userId);
        if (!user) return;

        await kv.hdel(USERS_KEY, userId);

        if (user.apiKey) {
            await kv.hdel(API_KEYS_KEY, user.apiKey);
        }

        await kv.del(`stats:${userId}`);
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

// ==========================================
// Gestión de Administradores (RBAC)
// ==========================================

const ADMINS_KEY = 'twitch_admins';
const LOGS_KEY = 'twitch_system_logs';
const MAX_LOGS = 50;

export const isAdmin = async (userId: string): Promise<boolean> => {
    if (CONFIG.ADMIN_ROOT_ID && userId === CONFIG.ADMIN_ROOT_ID) return true;
    const isWhiteListed = await kv.sismember(ADMINS_KEY, userId);
    return isWhiteListed === 1;
};

export const addAdmin = async (userId: string): Promise<void> => {
    await kv.sadd(ADMINS_KEY, userId);
    logger.info(`✨ Nuevo administrador añadido: ${userId}`);
    await addSystemLog('info', `Admin añadido: ${userId}`);
};

export const removeAdmin = async (userId: string): Promise<void> => {
    await kv.srem(ADMINS_KEY, userId);
    logger.info(`🗑️ Administrador eliminado: ${userId}`);
    await addSystemLog('warn', `Admin eliminado: ${userId}`);
};

export const getAllAdmins = async (): Promise<string[]> => {
    return await kv.smembers(ADMINS_KEY);
};

export const addSystemLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any
): Promise<void> => {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        };
        await kv.lpush(LOGS_KEY, JSON.stringify(logEntry));
        await kv.ltrim(LOGS_KEY, 0, MAX_LOGS - 1);
    } catch (_e) {
        console.error('Failed to log to KV:', _e);
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSystemLogs = async (): Promise<any[]> => {
    try {
        const logs = await kv.lrange(LOGS_KEY, 0, -1);
        return logs.map((l) => (typeof l === 'string' ? JSON.parse(l) : l));
    } catch (_e) {
        return [];
    }
};

export const clearSystemLogs = async (): Promise<void> => {
    await kv.del(LOGS_KEY);
};
