import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { getUserTimezone, setUserTimezone } from './userTimezoneCache';
import * as cacheService from './cacheService';

const DEFAULT_STAT_FIELDS = [
    'total_requests',
    'total_latency',
    'total_errors',
    'today_requests',
    'today_errors',
    'today_latency'
];

const USER_STATS_SELECT = [...DEFAULT_STAT_FIELDS, 'last_stats_date'].join(',');

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

const STATS_CACHE = new Map<
    string,
    { data: Record<string, number>; expiry: number; tz: string; rev: number }
>();
const STATS_TTL = 60 * 1000; // 60s — más eficiente en serverless (warm start aprovecha mejor el cache en memoria)
const MAX_STATS_CACHE_SIZE = 500;
const REVISION_BUMP_DEBOUNCE_MS = 5000;
const revisionBumpTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function invalidateStatsCache(userId: string): void {
    STATS_CACHE.delete(userId);
    EXISTS_CACHE.delete(userId);
    const pending = revisionBumpTimers.get(userId);
    if (pending) {
        clearTimeout(pending);
        revisionBumpTimers.delete(userId);
    }
}
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

function resolveLocalDateForUser(userId: string): string {
    const cached = STATS_CACHE.get(userId);
    const tz = cached?.tz ?? getUserTimezone(userId);
    return getDateFormatter(tz).format(new Date());
}



async function notifyStatsMutated(userId: string, options?: { invalidateAnalytics?: boolean }): Promise<void> {
    STATS_CACHE.delete(userId);
    if (options?.invalidateAnalytics) {
        await cacheService.invalidateDashboardAnalytics(userId).catch((e) =>
            logger.warn('Error invalidando analytics KV:', e)
        );
    }
    if (revisionBumpTimers.has(userId)) {
        return;
    }
    const timer = setTimeout(() => {
        revisionBumpTimers.delete(userId);
        void cacheService.bumpStatsRevision(userId).catch((e) =>
            logger.warn('Error bump stats revision:', e)
        );
    }, REVISION_BUMP_DEBOUNCE_MS);
    revisionBumpTimers.set(userId, timer);
}

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

    if (!error) addToExistsCache(userId);
}

// incrementUserStats has been replaced by the unified log_user_request

export const getUserStats = async (userId: string): Promise<Record<string, number>> => {
    try {
        const now = Date.now();
        const cached = STATS_CACHE.get(userId);

        if (cached && cached.expiry > now) {
            return cached.data;
        }

        const remoteRev = await cacheService.getStatsRevision(userId);
        if (cached && cached.rev >= remoteRev) {
            STATS_CACHE.set(userId, { ...cached, expiry: now + STATS_TTL });
            return cached.data;
        }

        const cachedTz = cached?.tz || null;

        const [totalsResult, userResult] = await Promise.all([
            supabase.from('user_stats').select(USER_STATS_SELECT).eq('user_id', userId).single(),
            cachedTz
                ? Promise.resolve(null)
                : supabase.from('users').select('timezone').eq('user_id', userId).single()
        ]);

        const totals = totalsResult.data as Record<string, number | string | null> | null;

        if (!totals) {
            await ensureStatsRow(userId);
        } else {
            addToExistsCache(userId);
        }

        const numericStats: Record<string, number> = {};
        for (const field of DEFAULT_STAT_FIELDS) {
            numericStats[field] = 0;
        }

        if (totals) {
            for (const field of DEFAULT_STAT_FIELDS) {
                numericStats[field] = ((totals as Record<string, unknown>)[field] as number) ?? 0;
            }
        }

        const tz =
            cachedTz ||
            (userResult as { users?: { timezone?: string } } | null)?.users?.timezone ||
            'UTC';
        const todayStr = getDateFormatter(tz).format(new Date());

        const lastStatsDate = totals?.last_stats_date as string | undefined;
        const isOutdated = lastStatsDate && lastStatsDate < todayStr;

        const effectiveTodayReqs = isOutdated ? 0 : Number(totals?.today_requests ?? 0);
        const effectiveTodayErrs = isOutdated ? 0 : Number(totals?.today_errors ?? 0);
        const effectiveTodayLat = isOutdated ? 0 : Number(totals?.today_latency ?? 0);

        numericStats[`d:${todayStr}`] = effectiveTodayReqs;
        numericStats[`e:${todayStr}`] = effectiveTodayErrs;
        numericStats[`l:${todayStr}`] = effectiveTodayLat;

        numericStats['today_req_raw'] = effectiveTodayReqs;
        numericStats['today_err_raw'] = effectiveTodayErrs;
        numericStats['today_lat_raw'] = effectiveTodayLat;

        // Recuperar dinámicamente las estadísticas de comandos del día actual
        const { data: dailyStats } = await supabase
            .from('user_daily_stats')
            .select('command_name, requests_count')
            .eq('user_id', userId)
            .eq('date', todayStr);

        if (dailyStats) {
            for (const row of dailyStats) {
                numericStats[row.command_name] = row.requests_count;
            }
        }

        if (STATS_CACHE.size >= MAX_STATS_CACHE_SIZE) {
            const iterator = STATS_CACHE.keys();
            for (let i = 0; i < 125; i++) {
                const k = iterator.next().value;
                if (k) STATS_CACHE.delete(k);
            }
        }
        STATS_CACHE.set(userId, { data: numericStats, expiry: now + STATS_TTL, tz, rev: remoteRev });
        return numericStats;
    } catch (e) {
        logger.error('Error obteniendo estadísticas:', e);
        return {};
    }
};

export const getDailyStats = async (userId: string, days: number = 7) => {
    try {
        const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('user_daily_stats')
            .select('*')
            .eq('user_id', userId)
            .gte('date', dateLimit)
            .order('date', { ascending: true });

        if (error) {
            logger.error('Error obteniendo daily stats:', error.message);
            return [];
        }
        return data || [];
    } catch (e) {
        logger.error('Error obteniendo daily stats:', e);
        return [];
    }
};

export const recordUserRequest = async (
    userId: string,
    latency: number,
    success: boolean,
    command: string | null = null,
    skip: boolean = false,
    userTimezone?: string
): Promise<void> => {
    try {
        if (skip) return;

        // Prioridad: timezone pasada explícitamente (evita el fallback a UTC en cold starts de Vercel)
        if (userTimezone) {
            setUserTimezone(userId, userTimezone);
        }

        let { error } = await supabase.rpc('log_user_request', {
            p_user_id: userId,
            p_command: command,
            p_latency: Math.round(latency),
            p_success: success,
            p_local_date: resolveLocalDateForUser(userId)
        });

        if (error) {
            if (!EXISTS_CACHE.has(userId)) {
                await ensureStatsRow(userId);
                const retry = await supabase.rpc('log_user_request', {
                    p_user_id: userId,
                    p_command: command,
                    p_latency: Math.round(latency),
                    p_success: success,
                    p_local_date: resolveLocalDateForUser(userId)
                });
                error = retry.error;
            }
            if (error) {
                logger.error('Error en RPC log_user_request:', error.message);
                return;
            }
        }

        addToExistsCache(userId);
        await notifyStatsMutated(userId, { invalidateAnalytics: true });
    } catch (e) {
        logger.error('Error registrando estadísticas de petición:', e);
    }
};

export const clearUserStatsAndLogs = async (userId: string): Promise<void> => {
    try {
        await Promise.all([
            supabase.from('user_stats').delete().eq('user_id', userId),
            supabase.from('user_daily_stats').delete().eq('user_id', userId),
            supabase.from('activity_logs').delete().eq('user_id', userId)
        ]);

        STATS_CACHE.delete(userId);
        EXISTS_CACHE.delete(userId);
        await cacheService.bumpStatsRevision(userId);
        logger.info(`🧹 Stats y actividad eliminados para: ${userId}`);
    } catch (e) {
        logger.error('Error clearing user stats and logs:', e);
        throw e;
    }
};
