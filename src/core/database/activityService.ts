import { kv } from '@vercel/kv';
import { logger } from '../utils/logger';
import {
    GLOBAL_STATS_KEY,
    USER_ACTIVITY_PREFIX,
    ACTIVITY_LIST_PREFIX,
    MAX_USER_LOGS
} from './keys';

export { USER_ACTIVITY_PREFIX, ACTIVITY_LIST_PREFIX };

export interface ActivityLogEntry {
    type: 'clip' | 'followage' | 'shoutout' | 'message' | 'russian' | 'magic8' | 'duel' | 'other';
    user: string;
    detail?: string;
}

export interface StoredActivityLog {
    timestamp: string;
    type: string;
    user: string;
    detail?: string;
}

interface UserStatsData {
    activity?: StoredActivityLog[];
    [key: string]: unknown;
}

// Sólo para actividad (logs de texto) sigue usando el Mega Hash
async function getRawActivity(userId: string): Promise<UserStatsData> {
    const data = await kv.hget<string>(GLOBAL_STATS_KEY, userId);
    if (!data) return {};
    return typeof data === 'string' ? JSON.parse(data) : (data as UserStatsData);
}

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
