import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import * as cacheService from './cacheService';
import { ANONYMOUS_USER_ID } from '../../types/constants';
import type {
    ActivityLogEntry,
    DashboardActivityLog
} from '../schemas/dashboardContracts';
import { VIEWER_ACTIVITY_TYPES } from '../schemas/commandCatalog';

export type { ActivityLogEntry } from '../schemas/dashboardContracts';
export type StoredActivityLog = DashboardActivityLog;

const MAX_USER_LOGS = 50;
const TRIM_THROTTLE_MS = 60_000;
const trimThrottle = new Map<string, number>();
const MAX_TRIM_THROTTLE_SIZE = 500;

export const addUserActivity = async (userId: string, entry: ActivityLogEntry): Promise<void> => {
    if (userId === ANONYMOUS_USER_ID) return;

    try {
        const userName = entry.user || 'Anónimo';
        const { error } = await supabase.from('activity_logs').insert({
            user_id: userId,
            activity_type: entry.type,
            user_name: userName,
            metadata: entry.metadata ?? {},
            created_at: new Date().toISOString()
        });

        if (error) {
            logger.error(`❌ Error Supabase guardando actividad {${entry.type}}:`, error.message);
            return;
        }

        await cacheService.del(`cache:activity:${userId}`).catch(() => {});

        // Si es una actividad de un viewer (no del streamer), invalidar también el caché del leaderboard
        // para que el próximo fetch tras un evento realtime siempre devuelva datos frescos.
        const viewerTypes = new Set<string>(VIEWER_ACTIVITY_TYPES);
        if (viewerTypes.has(entry.type)) {
            await cacheService.bumpStatsRevision(userId).catch(() => {});
        }


        const now = Date.now();
        const lastTrim = trimThrottle.get(userId) || 0;
        if (now - lastTrim > TRIM_THROTTLE_MS) {
            if (trimThrottle.size >= MAX_TRIM_THROTTLE_SIZE) {
                const first = trimThrottle.keys().next().value;
                if (first) trimThrottle.delete(first);
            }
            trimThrottle.set(userId, now);
            await trimUserLogs(userId).catch((e) => logger.error('Error en trimUserLogs asíncrono:', e));
        }
    } catch (e) {
        logger.error('Error fatal al añadir actividad:', e);
    }
};

const trimUserLogs = async (userId: string): Promise<void> => {
    const { error } = await supabase.rpc('trim_activity_logs', {
        p_user_id: userId,
        p_max: MAX_USER_LOGS
    });

    if (!error) return;

    logger.warn('trim_activity_logs RPC no disponible, usando fallback:', error.message);

    const { count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (count && count > MAX_USER_LOGS) {
        const { data: oldest } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(count - MAX_USER_LOGS);

        if (oldest && oldest.length > 0) {
            const ids = oldest.map((r) => r.id as string);
            await supabase.from('activity_logs').delete().in('id', ids);
        }
    }
};

export const getUserActivity = async (userId: string): Promise<StoredActivityLog[]> => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('created_at, activity_type, user_name, metadata')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(MAX_USER_LOGS);

        if (error) {
            logger.error('Error recuperando actividad de Supabase:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        logger.debug(`Actividad recuperada: ${data.length} registros para ${userId}`);
        return data.map((row) => ({
            timestamp: row.created_at as string,
            type: row.activity_type as string,
            user: (row.user_name as string) || 'Usuario',
            metadata: (row.metadata as Record<string, unknown>) ?? {}
        }));
    } catch (e) {
        logger.error('Error fatal obteniendo actividad:', e);
        return [];
    }
};
