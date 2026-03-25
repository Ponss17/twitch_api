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
    'total_errors'
];

// Caché L1 en memoria para evitar lecturas excesivas de Supabase
const STATS_CACHE = new Map<string, { data: Record<string, number>; expiry: number }>();
const STATS_TTL = 30 * 1000;

// Asegura que exista la fila de stats para el usuario antes de incrementar
async function ensureStatsRow(userId: string): Promise<void> {
    const defaultRow = DEFAULT_STAT_FIELDS.reduce(
        (acc, f) => {
            acc[f] = 0;
            return acc;
        },
        {} as Record<string, number>
    );

    await supabase
        .from('user_stats')
        .upsert(
            { user_id: userId, ...defaultRow },
            { onConflict: 'user_id', ignoreDuplicates: true }
        );
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
        // Si el comando no está mapeado, lo ignoramos para evitar inyección de columnas
        if (!column) {
            logger.warn(`Comando desconocido ignorado en stats: ${command}`);
            return;
        }

        await ensureStatsRow(userId);

        // Incremento atómico en una sola operación SQL, sin READ-MODIFY-WRITE
        const { error } = await supabase.rpc('increment_user_stat', {
            p_user_id: userId,
            p_column: column
        });

        if (error) {
            logger.error(
                `Error de Supabase incrementando {${column}} para {${userId}}:`,
                error.message
            );
        }

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

        // 1. Obtener totales históricos de user_stats
        const { data: totals, error: totalsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        // 2. Calcular de forma dinámica las peticiones de HOY desde activity_logs
        // Esto evita que tengamos que crear columnas de fechas infinitas en SQL
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startOfToday.toISOString());

        // Combinar datos
        const numericStats: Record<string, number> = {};
        for (const field of DEFAULT_STAT_FIELDS) {
            const legacyKey = field.replace('_count', '');
            numericStats[legacyKey] = 0;
        }

        if (!totalsError && totals) {
            for (const field of DEFAULT_STAT_FIELDS) {
                const legacyKey = field.replace('_count', '');
                numericStats[legacyKey] =
                    ((totals as Record<string, unknown>)[field] as number) ?? 0;
            }
        }

        // Inyectar llaves legacy que el Dashboard espera para "Hoy"
        const todayStr = new Date().toISOString().split('T')[0];
        numericStats[`d:${todayStr}`] = todayCount || 0;
        // Para errores y latencia hoy, usamos los totales como fallback o 0
        numericStats[`e:${todayStr}`] = 0;
        numericStats[`l:${todayStr}`] = 0;

        STATS_CACHE.set(userId, { data: numericStats, expiry: now + STATS_TTL });
        return numericStats;
    } catch (e) {
        logger.error('Error obteniendo estadísticas de usuario:', e);
        const empty: Record<string, number> = {};
        for (const field of DEFAULT_STAT_FIELDS) {
            const legacyKey = field.replace('_count', '');
            empty[legacyKey] = 0;
        }
        return empty;
    }
};

export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean
): Promise<void> => {
    try {
        await ensureStatsRow(userId);

        const { data: current } = await supabase
            .from('user_stats')
            .select('total_requests, total_errors, total_latency')
            .eq('user_id', userId)
            .single();

        const row = (current as Record<string, number>) ?? {};
        const updates: Record<string, number | string> = {
            total_requests: (row.total_requests ?? 0) + 1,
            total_latency: (row.total_latency ?? 0) + latency,
            last_updated: new Date().toISOString()
        };

        if (!success) {
            updates.total_errors = (row.total_errors ?? 0) + 1;
        }

        await supabase.from('user_stats').update(updates).eq('user_id', userId);

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
        logger.info(`🧹 Stats y actividad eliminados para: ${userId}`);
    } catch (e) {
        logger.error('Error clearing user stats and logs:', e);
        throw e;
    }
};
