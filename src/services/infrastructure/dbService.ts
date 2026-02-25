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
const GLOBAL_STATS_KEY = 'twitch_stats_all';
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
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
    if (!text) return text;
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
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

interface UserStatsData {
    activity?: StoredActivityLog[];
    [key: string]: any; // Para permitir campos dinámicos como d:YYYY-MM-DD
}

// Helper para manejar el Mega Hash global
async function getRawUserStats(userId: string): Promise<UserStatsData> {
    const data = await kv.hget<string>(GLOBAL_STATS_KEY, userId);
    if (!data) return {};
    return typeof data === 'string' ? JSON.parse(data) : (data as UserStatsData);
}

async function saveRawUserStats(userId: string, data: UserStatsData): Promise<void> {
    await kv.hset(GLOBAL_STATS_KEY, { [userId]: JSON.stringify(data) });

    // Auto-limpieza proactiva de claves individuales antiguas
    const oldKey = `stats:${userId}`;
    await kv.del(oldKey);
}

// Memoria caché para estadísticas (L1) para evitar hits constantes a Redis
const STATS_CACHE = new Map<string, { data: Record<string, number>; expiry: number }>();
const STATS_TTL = 30 * 1000; // 30 segundos

export const incrementUserStats = async (userId: string, command: string): Promise<void> => {
    try {
        const stats = await getRawUserStats(userId);
        stats[command] = (parseInt(stats[command]) || 0) + 1;
        await saveRawUserStats(userId, stats);
        STATS_CACHE.delete(userId); // Limpiar caché L1
    } catch (e) {
        logger.error('Error incrementing user stats:', e);
    }
};

export const getUserStats = async (userId: string): Promise<Record<string, number>> => {
    try {
        const now = Date.now();
        const cached = STATS_CACHE.get(userId);
        if (cached && cached.expiry > now) return cached.data;

        const stats = await getRawUserStats(userId);

        const numericStats: Record<string, number> = {
            clips: 0,
            followage: 0,
            so: 0,
            stalker: 0,
            trends: 0,
            roulette: 0,
            message: 0,
            russian: 0,
            magic8: 0,
            duel: 0,
            total_requests: 0,
            total_latency: 0,
            total_errors: 0
        };

        // Mezclar con los datos del JSON
        for (const [statKey, value] of Object.entries(stats)) {
            if (statKey !== 'activity') {
                numericStats[statKey] = parseInt(value as string) || 0;
            }
        }

        STATS_CACHE.set(userId, { data: numericStats, expiry: Date.now() + STATS_TTL });
        return numericStats;
    } catch (e) {
        logger.error('Error getting user stats:', e);
        return {
            clips: 0,
            followage: 0,
            so: 0,
            stalker: 0,
            trends: 0,
            roulette: 0,
            message: 0,
            russian: 0,
            magic8: 0,
            duel: 0
        };
    }
};

export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean
): Promise<void> => {
    try {
        const stats = await getRawUserStats(userId);
        const today = new Date().toISOString().split('T')[0];
        const dailyField = `d:${today}`;

        stats['total_requests'] = (parseInt(stats['total_requests']) || 0) + 1;
        stats['total_latency'] = (parseInt(stats['total_latency']) || 0) + latency;
        if (!success) {
            stats['total_errors'] = (parseInt(stats['total_errors']) || 0) + 1;
        }
        stats[dailyField] = (parseInt(stats[dailyField]) || 0) + 1;

        await saveRawUserStats(userId, stats);
        STATS_CACHE.delete(userId);
    } catch (e) {
        logger.error('Error recording user request stats:', e);
    }
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

export const clearUserStatsAndLogs = async (userId: string): Promise<void> => {
    try {
        // Borrar del Mega Hash
        await kv.hdel(GLOBAL_STATS_KEY, userId);

        // Borrar rastro de claves legacy
        const statsKey = `stats:${userId}`;
        await kv.del(statsKey);
        const activityKey = `${USER_ACTIVITY_PREFIX}${userId}`;
        await kv.del(activityKey);
        const dailyPattern = `stats:${userId}:daily:*`;
        const oldKeys = await kv.keys(dailyPattern);
        if (oldKeys.length > 0) await kv.del(...oldKeys);

        STATS_CACHE.delete(userId);
        logger.info(`🧹 Datos limpiados y eliminados del Mega Hash para: ${userId}`);
    } catch (e) {
        logger.error('Error clearing user stats and logs:', e);
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
const MAX_LOGS = 200;

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
    details?: Record<string, unknown>
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

interface SystemLogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: Record<string, unknown>;
}

export const getSystemLogs = async (): Promise<SystemLogEntry[]> => {
    try {
        const logs = await kv.lrange(LOGS_KEY, 0, -1);
        return logs.map((l) => (typeof l === 'string' ? JSON.parse(l) : l)) as SystemLogEntry[];
    } catch (_e) {
        return [];
    }
};

// ==========================================
// Actividad de Usuario (Logs de comandos)
// ==========================================

const USER_ACTIVITY_PREFIX = 'activity:';
const MAX_USER_LOGS = 50;

export interface ActivityLogEntry {
    type: 'clip' | 'followage' | 'shoutout' | 'message' | 'russian' | 'magic8' | 'duel' | 'other';
    user: string;
    detail?: string;
}

interface StoredActivityLog {
    timestamp: string;
    type: string;
    user: string;
    detail?: string;
}

export const addUserActivity = async (userId: string, entry: ActivityLogEntry): Promise<void> => {
    try {
        const logEntry: StoredActivityLog = {
            timestamp: new Date().toISOString(),
            type: entry.type,
            user: entry.user,
            ...(entry.detail && { detail: entry.detail })
        };

        const stats = await getRawUserStats(userId);
        const logs: StoredActivityLog[] = stats.activity || [];

        // Añadir nuevo log al principio y limitar a 50
        logs.unshift(logEntry);
        stats.activity = logs.slice(0, MAX_USER_LOGS);

        await saveRawUserStats(userId, stats);

        // Limpieza de clave legacy (proactivo)
        const legacyKey = `${USER_ACTIVITY_PREFIX}${userId}`;
        await kv.del(legacyKey);
    } catch (e) {
        logger.error('Error adding user activity:', e);
    }
};

export const getUserActivity = async (userId: string): Promise<StoredActivityLog[]> => {
    try {
        const stats = await getRawUserStats(userId);
        return stats.activity || [];
    } catch (e) {
        logger.error('Error getting user activity:', e);
        return [];
    }
};

export const clearSystemLogs = async (): Promise<void> => {
    await kv.del(LOGS_KEY);
};
