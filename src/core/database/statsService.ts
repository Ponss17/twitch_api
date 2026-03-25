import { kv } from '@vercel/kv';
import { logger } from '../utils/logger';
import {
    GLOBAL_STATS_KEY,
    STATS_CNT_PREFIX,
    USER_ACTIVITY_PREFIX,
    ACTIVITY_LIST_PREFIX
} from './keys';
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
