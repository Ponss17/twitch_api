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

// Caché L1 en memoria para evitar lecturas excesivas de Supabase
const STATS_CACHE = new Map<string, { data: Record<string, number>; expiry: number }>();
const STATS_TTL = 15 * 1000; // 15 segundos de caché para fluidez y precisión

// Asegura que exista la fila de stats para el usuario antes de incrementar
async function ensureStatsRow(userId: string): Promise<void> {
    if (EXISTS_CACHE.has(userId)) return;

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

    if (!error) EXISTS_CACHE.add(userId);
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
            const newVal = ((current as unknown as Record<string, number>)?.[column] || 0) + 1;
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

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Lanzamos ambas peticiones a Supabase en PARALELO para reducir latencia
        const [totalsResult, activityResult] = await Promise.all([
            supabase.from('user_stats').select('*').eq('user_id', userId).single(),
            supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('created_at', startOfToday.toISOString())
        ]);

        const totals = totalsResult.data;
        const todayCount = activityResult.count || 0;

        if (!totals) {
            await ensureStatsRow(userId);
        } else {
            EXISTS_CACHE.add(userId);
        }

        // Combinar datos
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

        const todayStr = new Date().toISOString().split('T')[0];
        // Priorizamos los contadores reales de las nuevas columnas para los cuadros superiores
        numericStats[`d:${todayStr}`] = totals?.today_requests ?? todayCount;
        numericStats[`e:${todayStr}`] = totals?.today_errors ?? (numericStats.total_errors || 0);
        numericStats[`l:${todayStr}`] = totals?.today_latency ?? (numericStats.total_latency || 0);

        STATS_CACHE.set(userId, { data: numericStats, expiry: now + STATS_TTL });
        return numericStats;
    } catch (e) {
        logger.error('Error obteniendo estadísticas:', e);
        return {};
    }
};

/*
 * IMPORTANTE: Antes de usar esta función, ejecuta el siguiente SQL en Supabase:
 *
 * CREATE OR REPLACE FUNCTION record_user_request(
 *   p_user_id TEXT,
 *   p_latency INT,
 *   p_success BOOLEAN
 * ) RETURNS VOID AS $$
 * DECLARE
 *   v_today DATE := CURRENT_DATE;
 * BEGIN
 *   UPDATE user_stats SET
 *     today_requests = CASE WHEN last_stats_date < v_today THEN 1 ELSE today_requests + 1 END,
 *     today_errors   = CASE WHEN last_stats_date < v_today THEN (CASE WHEN NOT p_success THEN 1 ELSE 0 END) ELSE today_errors + (CASE WHEN NOT p_success THEN 1 ELSE 0 END) END,
 *     today_latency  = CASE WHEN last_stats_date < v_today THEN p_latency ELSE today_latency + p_latency END,
 *     last_stats_date = v_today,
 *     total_requests = total_requests + 1,
 *     total_latency  = total_latency + p_latency,
 *     total_errors   = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
 *     last_updated   = NOW()
 *   WHERE user_id = p_user_id;
 * END;
 * $$ LANGUAGE plpgsql;
 */
export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean
): Promise<void> => {
    try {
        if (!EXISTS_CACHE.has(userId)) {
            await ensureStatsRow(userId);
        }

        const { error } = await supabase.rpc('record_user_request', {
            p_user_id: userId,
            p_latency: Math.round(latency),
            p_success: success
        });

        if (error) {
            EXISTS_CACHE.delete(userId);
            logger.error('Error en RPC record_user_request:', error.message);
            return;
        }

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
