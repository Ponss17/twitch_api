import { kv } from '@vercel/kv';
import { StoredUser } from '../../types/twitch';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/env';

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
                const totalRequests = Object.entries(stats).reduce((acc, [key, val]) => {
                    if (key === 'activity') return acc;
                    return acc + (typeof val === 'number' ? val : 0);
                }, 0);

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
// Estadísticas (Por Usuario) — Redis Atómico
// ==========================================

interface UserStatsData {
    activity?: StoredActivityLog[];
    [key: string]: unknown;
}

const STATS_CNT_PREFIX = 'twitch_stats_cnt:';
const DEFAULT_STAT_FIELDS = [
    'clips',
    'followage',
    'so',
    'stalker',
    'trends',
    'roulette',
    'message',
    'russian',
    'magic8',
    'duel',
    'total_requests',
    'total_latency',
    'total_errors'
];

// Caché L1 para lecturas frecuentes
const STATS_CACHE = new Map<string, { data: Record<string, number>; expiry: number }>();
const STATS_TTL = 30 * 1000;

// Sólo para actividad (logs de texto) sigue usando el Mega Hash
async function getRawActivity(userId: string): Promise<UserStatsData> {
    const data = await kv.hget<string>(GLOBAL_STATS_KEY, userId);
    if (!data) return {};
    return typeof data === 'string' ? JSON.parse(data) : (data as UserStatsData);
}

/**
 * Migra contadores legacy del Mega Hash al nuevo hash atómico (se ejecuta una sola vez).
 */
async function migrateStatsIfNeeded(userId: string): Promise<void> {
    const cntKey = `${STATS_CNT_PREFIX}${userId}`;
    const exists = await kv.exists(cntKey);
    if (exists) return;

    const legacyData = await kv.hget<string>(GLOBAL_STATS_KEY, userId);
    if (!legacyData) return;

    try {
        const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData;
        const toMigrate: Record<string, number> = {};
        for (const [key, val] of Object.entries(parsed)) {
            if (key !== 'activity' && typeof val !== 'object') {
                const num = parseInt(val as string);
                if (!isNaN(num) && num > 0) toMigrate[key] = num;
            }
        }
        if (Object.keys(toMigrate).length > 0) {
            await kv.hset(cntKey, toMigrate);
            logger.info(
                `[Stats] Migrados ${Object.keys(toMigrate).length} contadores para userId: ${userId}`
            );
        }
    } catch (e) {
        logger.warn(`[Stats] No se pudo migrar datos legacy para ${userId}:`, (e as Error).message);
    }
}

export const incrementUserStats = async (userId: string, command: string): Promise<void> => {
    try {
        const cntKey = `${STATS_CNT_PREFIX}${userId}`;
        await migrateStatsIfNeeded(userId);
        await kv.hincrby(cntKey, command, 1);
        STATS_CACHE.delete(userId);
    } catch (e) {
        logger.error('Error incrementando estadísticas de usuario:', e);
    }
};

export const getUserStats = async (userId: string): Promise<Record<string, number>> => {
    try {
        const now = Date.now();
        const cached = STATS_CACHE.get(userId);
        if (cached && cached.expiry > now) return cached.data;

        await migrateStatsIfNeeded(userId);
        const cntKey = `${STATS_CNT_PREFIX}${userId}`;
        const raw = await kv.hgetall<Record<string, string>>(cntKey);

        const numericStats: Record<string, number> = {};
        for (const field of DEFAULT_STAT_FIELDS) numericStats[field] = 0;

        if (raw) {
            for (const [key, val] of Object.entries(raw)) {
                numericStats[key] = parseInt(val) || 0;
            }
        }

        STATS_CACHE.set(userId, { data: numericStats, expiry: now + STATS_TTL });
        return numericStats;
    } catch (e) {
        logger.error('Error obteniendo estadísticas de usuario:', e);
        const empty: Record<string, number> = {};
        for (const f of DEFAULT_STAT_FIELDS) empty[f] = 0;
        return empty;
    }
};

export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean
): Promise<void> => {
    try {
        const cntKey = `${STATS_CNT_PREFIX}${userId}`;
        await migrateStatsIfNeeded(userId);

        const today = new Date().toISOString().split('T')[0];

        // Pipeline de operaciones atómicas con Promise.all
        const ops: Promise<unknown>[] = [
            kv.hincrby(cntKey, 'total_requests', 1),
            kv.hincrby(cntKey, 'total_latency', latency),
            kv.hincrby(cntKey, `d:${today}`, 1),
            kv.hincrby(cntKey, `l:${today}`, latency)
        ];

        if (!success) {
            ops.push(kv.hincrby(cntKey, 'total_errors', 1));
            ops.push(kv.hincrby(cntKey, `e:${today}`, 1));
        }

        await Promise.all(ops);
        STATS_CACHE.delete(userId);
    } catch (e) {
        logger.error('Error registrando estadísticas de petición:', e);
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
        await Promise.all([
            kv.hdel(GLOBAL_STATS_KEY, userId),
            kv.del(`${STATS_CNT_PREFIX}${userId}`),
            kv.del(`stats:${userId}`),
            kv.del(`${USER_ACTIVITY_PREFIX}${userId}`),
            kv.del(`${ACTIVITY_LIST_PREFIX}${userId}`)
        ]);

        const oldKeys = await kv.keys(`stats:${userId}:daily:*`);
        if (oldKeys.length > 0) await kv.del(...oldKeys);

        STATS_CACHE.delete(userId);
        logger.info(`🧹 Stats y actividad eliminados para: ${userId}`);
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
        logger.error('Failed to log to KV:', _e);
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

const ACTIVITY_LIST_PREFIX = 'activity_v2:';

export const addUserActivity = async (userId: string, entry: ActivityLogEntry): Promise<void> => {
    try {
        const logEntry: StoredActivityLog = {
            timestamp: new Date().toISOString(),
            type: entry.type,
            user: entry.user,
            ...(entry.detail && { detail: entry.detail })
        };

        const listKey = `${ACTIVITY_LIST_PREFIX}${userId}`;
        await kv.lpush(listKey, JSON.stringify(logEntry));
        await kv.ltrim(listKey, 0, MAX_USER_LOGS - 1);

        // Limpieza de claves legacy (proactivo)
        await kv.del(`${USER_ACTIVITY_PREFIX}${userId}`);
    } catch (e) {
        logger.error('Error adding user activity:', e);
    }
};

export const getUserActivity = async (userId: string): Promise<StoredActivityLog[]> => {
    try {
        const listKey = `${ACTIVITY_LIST_PREFIX}${userId}`;
        const items = await kv.lrange<string>(listKey, 0, MAX_USER_LOGS - 1);

        if (items && items.length > 0) {
            return items.map((i) =>
                typeof i === 'string' ? JSON.parse(i) : i
            ) as StoredActivityLog[];
        }

        // Fallback: leer del Mega Hash si la lista nueva está vacía (datos legacy)
        const legacyData = await getRawActivity(userId);
        if (legacyData.activity && legacyData.activity.length > 0) {
            logger.info(`[Activity] Migrando actividad legacy para userId: ${userId}`);
            for (let i = legacyData.activity.length - 1; i >= 0; i--) {
                await kv.lpush(listKey, JSON.stringify(legacyData.activity[i]));
            }
            await kv.ltrim(listKey, 0, MAX_USER_LOGS - 1);
            return legacyData.activity;
        }

        return [];
    } catch (e) {
        logger.error('Error getting user activity:', e);
        return [];
    }
};

export const clearSystemLogs = async (): Promise<void> => {
    await kv.del(LOGS_KEY);
};

// ==========================================
// Log de Auditoría (Acciones Sensibles)
// ==========================================

const AUDIT_LOGS_KEY = 'twitch_audit_logs';
const MAX_AUDIT_LOGS = 500;

export type AuditAction =
    | 'api_key_regenerated'
    | 'user_deleted'
    | 'user_blocked'
    | 'user_unblocked'
    | 'admin_added'
    | 'admin_removed'
    | 'stats_cleared';

interface AuditLogEntry {
    timestamp: string;
    action: AuditAction;
    userId: string;
    performedBy?: string;
    metadata?: Record<string, unknown>;
}

export const addAuditLog = async (
    action: AuditAction,
    userId: string,
    performedBy?: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    try {
        const entry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            ...(performedBy && { performedBy }),
            ...(metadata && { metadata })
        };
        await kv.lpush(AUDIT_LOGS_KEY, JSON.stringify(entry));
        await kv.ltrim(AUDIT_LOGS_KEY, 0, MAX_AUDIT_LOGS - 1);
    } catch (e) {
        logger.warn('No se pudo guardar el log de auditoría:', (e as Error).message);
    }
};

export const getAuditLogs = async (limit = 100): Promise<AuditLogEntry[]> => {
    try {
        const logs = await kv.lrange(AUDIT_LOGS_KEY, 0, limit - 1);
        return logs.map((l) => (typeof l === 'string' ? JSON.parse(l) : l)) as AuditLogEntry[];
    } catch (_e) {
        return [];
    }
};
