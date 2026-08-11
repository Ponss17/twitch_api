/**
 * Calcula métricas de analíticas a partir de los stats crudos del usuario.
 * Función pura sin dependencias — ideal para testing.
 */
const computeAnalyticsFromStats = (stats: Record<string, number>) => {
    const todayRequests = stats['today_req_raw'] || 0;
    const todayErrors = stats['today_err_raw'] || 0;
    const todayLatency = stats['today_lat_raw'] || 0;

    const avgLatencyMs = todayRequests > 0 ? Math.round(todayLatency / todayRequests) : 0;
    const rawSuccessRate =
        todayRequests > 0 ? parseFloat(((1 - todayErrors / todayRequests) * 100).toFixed(1)) : 0;

    return {
        todayRequests,
        avgLatencyMs,
        rawSuccessRate,
        averageLatency: `${avgLatencyMs}ms (${(avgLatencyMs / 1000).toFixed(1)}s)`,
        successRate: `${rawSuccessRate}%`
    };
};

/** Revisión embebida en caché KV de analytics — invalida cuando sube `cache:stats:rev`. */
export const ANALYTICS_STATS_REV_KEY = '_statsRev';

export function isAnalyticsCacheFresh(
    cached: Record<string, unknown> | null,
    currentRev: number
): boolean {
    if (!cached || currentRev < 0) return false;
    const cachedRev =
        typeof cached[ANALYTICS_STATS_REV_KEY] === 'number' ? cached[ANALYTICS_STATS_REV_KEY] : -1;
    return cachedRev === currentRev;
}

export function buildAnalyticsPayload(
    stats: Record<string, number>,
    statsRev: number,
    leaderboards?: { leaderboardToday: Record<string, unknown>[]; leaderboardWeekly: Record<string, unknown>[] }
): Record<string, unknown> {
    return {
        ...stats,
        totalRequests: stats.total_requests || 0,
        ...computeAnalyticsFromStats(stats),
        [ANALYTICS_STATS_REV_KEY]: statsRev,
        leaderboardToday: leaderboards?.leaderboardToday || [],
        leaderboardWeekly: leaderboards?.leaderboardWeekly || []
    };
}

/** Desanida el formato legacy del cache de perfil (`{ profileData, limits, degraded }`). */
export function flattenCachedDashboardProfile(
    cached: Record<string, unknown> | null
): { profile: Record<string, unknown> | null; wasNested: boolean } {
    if (!cached) return { profile: null, wasNested: false };
    const nested = cached.profileData;
    const looksNested =
        nested !== null &&
        typeof nested === 'object' &&
        !Array.isArray(nested) &&
        typeof (cached as { login?: unknown }).login !== 'string' &&
        typeof (nested as { login?: unknown }).login === 'string';
    if (!looksNested) return { profile: cached, wasNested: false };

    const nestedProfile = nested as Record<string, unknown>;
    const nestedLimits =
        cached.limits !== null && typeof cached.limits === 'object' && !Array.isArray(cached.limits)
            ? (cached.limits as Record<string, unknown>)
            : {};
    const {
        profileData: _profileData,
        limits: _limits,
        degraded: _degraded,
        ...rest
    } = cached;
    return {
        profile: { ...nestedProfile, ...nestedLimits, ...rest },
        wasNested: true
    };
}

/** Stats en cero tras reiniciar estadísticas (respuesta inmediata al cliente). */
export const buildEmptyUserAnalytics = (): Record<string, number | string> => {
    const stats: Record<string, number> = {
        clips: 0,
        followage: 0,
        watchtime: 0,
        so: 0,
        stalker: 0,
        trends: 0,
        roulette: 0,
        message: 0,
        russian: 0,
        magic8: 0,
        duel: 0,
        slots: 0,
        today_req_raw: 0,
        today_err_raw: 0,
        today_lat_raw: 0,
        total_requests: 0
    };
    return {
        ...stats,
        totalRequests: 0,
        ...computeAnalyticsFromStats(stats)
    };
};
