import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

const DEFAULT_STAT_FIELDS = [
    'clips_count',
    'followage_count',
    'so_count',
    'stalker_count',
    'trends_count',
    'roulette_count',
    'message_count',
    'russian_count',
    'magic8_count',
    'duel_count',
    'total_requests',
    'total_latency',
    'total_errors',
    'today_requests',
    'today_errors',
    'today_latency'
];

// Cache para saber si un usuario ya tiene fila de stats y evitar upserts constantes
const EXISTS_CACHE = new Set<string>();

const addToExistsCache = (userId: string) => {
    if (EXISTS_CACHE.size >= 1000) {
        const iterator = EXISTS_CACHE.keys();
        for (let i = 0; i < 250; i++) {
            const val = iterator.next().value;
            if (val) EXISTS_CACHE.delete(val);
        }
    }
    EXISTS_CACHE.add(userId);
};

const STATS_CACHE = new Map<string, { data: Record<string, number>; expiry: number; tz: string }>();
const STATS_TTL = 15 * 1000;
const MAX_STATS_CACHE_SIZE = 500;
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getDateFormatter = (tz: string): Intl.DateTimeFormat => {
    let formatter = dateFormatterCache.get(tz);
    if (!formatter) {
        if (dateFormatterCache.size >= 100) {
            const first = dateFormatterCache.keys().next().value;
            if (first) dateFormatterCache.delete(first);
        }
        formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        dateFormatterCache.set(tz, formatter);
    }
    return formatter;
};

// Asegura que exista la fila de stats para el usuario antes de incrementar
async function ensureStatsRow(userId: string): Promise<void> {
    if (EXISTS_CACHE.has(userId)) return;

    const { count } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (count && count > 0) {
        addToExistsCache(userId);
        return;
    }

    const defaultRow = DEFAULT_STAT_FIELDS.reduce(
        (acc, f) => {
            acc[f] = 0;
            return acc;
        },
        {} as Record<string, number>
    );

    const { error } = await supabase
        .from('user_stats')
        .upsert(
            { user_id: userId, ...defaultRow },
            { onConflict: 'user_id', ignoreDuplicates: true }
        );

    if (!error) addToExistsCache(userId);
}

export const incrementUserStats = async (userId: string, command: string): Promise<void> => {
    try {
        const columnMap: Record<string, string> = {
            clips: 'clips_count',
            followage: 'followage_count',
            so: 'so_count',
            stalker: 'stalker_count',
            trends: 'trends_count',
            roulette: 'roulette_count',
            message: 'message_count',
            russian: 'russian_count',
            magic8: 'magic8_count',
            duel: 'duel_count'
        };

        const column = columnMap[command];
        if (!column) return;

        // Intentar incremento atómico via RPC
        const { error } = await supabase.rpc('increment_user_stat', {
            p_user_id: userId,
            p_column: column
        });

        // Si el RPC falla (ej. usuario no existe aún), asegurar fila y reintentar manual
        if (error) {
            await ensureStatsRow(userId);
            const { data: current } = await supabase
                .from('user_stats')
                .select(column)
                .eq('user_id', userId)
                .single();
            const currentData = current as Record<string, number> | null;
            const newVal = (currentData?.[column] || 0) + 1;
            await supabase
                .from('user_stats')
                .update({ [column]: newVal })
                .eq('user_id', userId);
        }

        STATS_CACHE.delete(userId);
    } catch (e) {
        logger.error('Error incrementando estadísticas:', e);
    }
};

export const getUserStats = async (userId: string): Promise<Record<string, number>> => {
    try {
        const now = Date.now();
        const cached = STATS_CACHE.get(userId);
        if (cached && cached.expiry > now) return cached.data;

        const cachedTz = cached?.tz || null;

        const [totalsResult, userResult] = await Promise.all([
            supabase.from('user_stats').select('*').eq('user_id', userId).single(),
            cachedTz
                ? Promise.resolve(null)
                : supabase.from('users').select('timezone').eq('user_id', userId).single()
        ]);

        const totals = totalsResult.data;

        if (!totals) {
            await ensureStatsRow(userId);
        } else {
            addToExistsCache(userId);
        }

        const numericStats: Record<string, number> = {};
        for (const field of DEFAULT_STAT_FIELDS) {
            const legacyKey = field.replace('_count', '');
            numericStats[legacyKey] = 0;
        }

        if (totals) {
            for (const field of DEFAULT_STAT_FIELDS) {
                const legacyKey = field.replace('_count', '');
                numericStats[legacyKey] =
                    ((totals as Record<string, unknown>)[field] as number) ?? 0;
            }
        }

        const tz =
            cachedTz ||
            (userResult as { data: { timezone: string } | null } | null)?.data?.timezone ||
            'UTC';
        const todayStr = getDateFormatter(tz).format(new Date());

        numericStats[`d:${todayStr}`] = totals?.today_requests ?? 0;
        numericStats[`e:${todayStr}`] = totals?.today_errors ?? 0;
        numericStats[`l:${todayStr}`] = totals?.today_latency ?? 0;

        numericStats['today_req_raw'] = totals?.today_requests ?? 0;
        numericStats['today_err_raw'] = totals?.today_errors ?? 0;
        numericStats['today_lat_raw'] = totals?.today_latency ?? 0;

        if (STATS_CACHE.size >= MAX_STATS_CACHE_SIZE) {
            const iterator = STATS_CACHE.keys();
            for (let i = 0; i < 125; i++) {
                const k = iterator.next().value;
                if (k) STATS_CACHE.delete(k);
            }
        }
        STATS_CACHE.set(userId, { data: numericStats, expiry: now + STATS_TTL, tz });
        return numericStats;
    } catch (e) {
        logger.error('Error obteniendo estadísticas:', e);
        return {};
    }
};

export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean,
    skip: boolean = false
): Promise<void> => {
    try {
        if (skip) return;

        const { error } = await supabase.rpc('record_user_request', {
            p_user_id: userId,
            p_latency: Math.round(latency),
            p_success: success
        });

        if (error) {
            if (!EXISTS_CACHE.has(userId)) {
                await ensureStatsRow(userId);
            }
            logger.error('Error en RPC record_user_request:', error.message);
            return;
        }

        addToExistsCache(userId);
        STATS_CACHE.delete(userId);
    } catch (e) {
        logger.error('Error registrando estadísticas de petición:', e);
    }
};

export const clearUserStatsAndLogs = async (userId: string): Promise<void> => {
    try {
        await Promise.all([
            supabase.from('user_stats').delete().eq('user_id', userId),
            supabase.from('activity_logs').delete().eq('user_id', userId)
        ]);

        STATS_CACHE.delete(userId);
        EXISTS_CACHE.delete(userId);
        logger.info(`🧹 Stats y actividad eliminados para: ${userId}`);
    } catch (e) {
        logger.error('Error clearing user stats and logs:', e);
        throw e;
    }
};
