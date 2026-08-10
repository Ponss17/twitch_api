/** Categorías del resumen de actividad y contadores por recurso. */
export const DASHBOARD_USAGE_CATEGORIES = [
    { id: 'cat-commands', keys: ['clips', 'followage', 'watchtime', 'so', 'message'] as const },
    { id: 'cat-tools', keys: ['stalker', 'trends', 'roulette'] as const },
    { id: 'cat-minigames', keys: ['russian', 'magic8', 'duel', 'slots'] as const }
] as const;

export type DashboardUsageKey = (typeof DASHBOARD_USAGE_CATEGORIES)[number]['keys'][number];

const DASHBOARD_USAGE_KEYS: readonly DashboardUsageKey[] = DASHBOARD_USAGE_CATEGORIES.flatMap(
    (cat) => cat.keys
);

export function getStatsLocalDateString(timeZone?: string, date: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

/** `last_stats_date` anterior al día local efectivo → contadores del día en cero. */
export function isStatsDateOutdated(
    lastStatsDate: unknown,
    todayLocal = getStatsLocalDateString()
): boolean {
    return typeof lastStatsDate === 'string' && lastStatsDate.length > 0 && lastStatsDate < todayLocal;
}

/** Peticiones de hoy según timestamps del historial (corrige desfases de zona horaria en daily_stats). */
export function buildTodayActivityStats(
    activity: ReadonlyArray<{ timestamp?: string; type?: string }> | undefined,
    timeZone?: string
): { total: number; byCommand: Map<string, number> } {
    const todayStr = getStatsLocalDateString(timeZone);
    const byCommand = new Map<string, number>();
    let total = 0;

    for (const item of activity ?? []) {
        if (!item.timestamp) continue;
        const itemDate = getStatsLocalDateString(timeZone, new Date(item.timestamp));
        if (itemDate !== todayStr) continue;
        total += 1;
        const cmd = !item.type || item.type === 'other' ? 'other' : item.type;
        byCommand.set(cmd, (byCommand.get(cmd) ?? 0) + 1);
    }

    return { total, byCommand };
}

/** Suma de usos del día por recurso — misma métrica que el resumen del perfil. */
export function sumDashboardCategoryUsage(
    stats: Partial<Pick<DashboardLiveStats, DashboardUsageKey>>
): number {
    return DASHBOARD_USAGE_KEYS.reduce((sum, key) => sum + (stats[key] ?? 0), 0);
}

/** Total de peticiones de hoy: prioriza `today_requests` y complementa con la suma por comando. */
export function getTodayRequestsTotal(
    stats: Partial<Pick<DashboardLiveStats, DashboardUsageKey | 'todayRequests'>>
): number {
    const fromCounter = stats.todayRequests ?? 0;
    const fromUsage = sumDashboardCategoryUsage(stats);
    return Math.max(fromCounter, fromUsage);
}

export interface ViewerLeaderboardEntry {
    user_name: string;
    total: number;
    last_seen: string;
}

/** Stats en vivo desde `user_stats` (Realtime o API). */
export interface DashboardLiveStats {
    todayRequests: number;
    rawSuccessRate: number;
    avgLatencyMs: number;
    clips: number;
    followage: number;
    watchtime: number;
    so: number;
    message: number;
    stalker: number;
    trends: number;
    roulette: number;
    russian: number;
    magic8: number;
    duel: number;
    slots: number;
    timeSeries?: DashboardTimeSeriesRow[];
    leaderboardToday?: ViewerLeaderboardEntry[];
    leaderboardWeekly?: ViewerLeaderboardEntry[];
}

export interface DashboardTimeSeriesRow {
    date: string;
    requests_count: number;
    errors_count: number;
    latency_sum: number;
    command_name: string;
}

/** Parche enviado por Realtime al cambiar una fila de `user_daily_stats`. */
export type DailyStatsRealtimePatch = DashboardTimeSeriesRow;

export type RealtimeStatsUpdate = Partial<DashboardLiveStats> & {
    __dailyStatsPatch?: DailyStatsRealtimePatch;
};

export function mergeTimeSeriesPatch(
    prev: DashboardTimeSeriesRow[] | undefined,
    patch: DailyStatsRealtimePatch
): DashboardTimeSeriesRow[] {
    const series = [...(prev ?? [])];
    const idx = series.findIndex(
        (row) => row.date === patch.date && row.command_name === patch.command_name
    );
    if (idx >= 0) {
        series[idx] = patch;
    } else {
        series.push(patch);
    }
    return series;
}

export function mergeDashboardStats(
    prev: DashboardLiveStats,
    next: RealtimeStatsUpdate
): DashboardLiveStats {
    const { __dailyStatsPatch, ...rest } = next;
    const merged: DashboardLiveStats = { ...prev, ...rest } as DashboardLiveStats;
    if (__dailyStatsPatch) {
        merged.timeSeries = mergeTimeSeriesPatch(prev.timeSeries, __dailyStatsPatch);
    }
    merged.todayRequests = getTodayRequestsTotal(merged);
    return merged;
}

const COUNT_COLUMNS: Record<string, keyof DashboardLiveStats> = {
    clips_count: 'clips',
    followage_count: 'followage',
    watchtime_count: 'watchtime',
    so_count: 'so',
    message_count: 'message',
    stalker_count: 'stalker',
    trends_count: 'trends',
    roulette_count: 'roulette',
    russian_count: 'russian',
    magic8_count: 'magic8',
    duel_count: 'duel',
    slots_count: 'slots'
};

export function parseDashboardStatsFromRow(
    raw: Record<string, unknown>,
    options?: { todayLocal?: string; isPartialUpdate?: false }
): DashboardLiveStats;
export function parseDashboardStatsFromRow(
    raw: Record<string, unknown>,
    options: { todayLocal?: string; isPartialUpdate: true }
): Partial<DashboardLiveStats>;
export function parseDashboardStatsFromRow(
    raw: Record<string, unknown>,
    options?: { todayLocal?: string; isPartialUpdate?: boolean }
): DashboardLiveStats | Partial<DashboardLiveStats> {
    const isOutdated = isStatsDateOutdated(raw.last_stats_date, options?.todayLocal);

    // Patch parcial obsoleto: no tocar estado (evita wipe a 0 por TZ / medianoche).
    if (options?.isPartialUpdate && isOutdated) {
        return {};
    }

    const isPartial = Boolean(options?.isPartialUpdate) && !isOutdated;

    const result: Partial<DashboardLiveStats> = {};

    if (!isPartial || 'today_requests' in raw || 'today_errors' in raw || 'today_latency' in raw) {
        const todayRequests = isOutdated ? 0 : Number(raw.today_requests ?? 0);
        const todayErrors = isOutdated ? 0 : Number(raw.today_errors ?? 0);
        const todayLatency = isOutdated ? 0 : Number(raw.today_latency ?? 0);
        
        if (!isPartial || 'today_requests' in raw) result.todayRequests = todayRequests;
        if (!isPartial || 'today_errors' in raw || 'today_requests' in raw) {
            result.rawSuccessRate = todayRequests > 0
                ? parseFloat(((1 - todayErrors / todayRequests) * 100).toFixed(1))
                : 0;
        }
        if (!isPartial || 'today_latency' in raw || 'today_requests' in raw) {
            result.avgLatencyMs = todayRequests > 0 ? Math.round(todayLatency / todayRequests) : 0;
        }
    }

    for (const [column, key] of Object.entries(COUNT_COLUMNS)) {
        const countKey = key as keyof typeof EMPTY_DASHBOARD_LIVE_STATS;
        if (!isPartial || column in raw || countKey in raw) {
            (result as Record<string, number>)[countKey] = isOutdated ? 0 : Number(raw[column] ?? raw[countKey] ?? 0);
        }
    }

    if ('timeSeries' in raw) {
        result.timeSeries = raw.timeSeries as DashboardTimeSeriesRow[];
    }
    
    if ('leaderboardToday' in raw) {
        result.leaderboardToday = raw.leaderboardToday as ViewerLeaderboardEntry[];
    } else if (!isPartial) {
        result.leaderboardToday = [];
    }
    
    if ('leaderboardWeekly' in raw) {
        result.leaderboardWeekly = raw.leaderboardWeekly as ViewerLeaderboardEntry[];
    } else if (!isPartial) {
        result.leaderboardWeekly = [];
    }

    return isPartial ? result : (result as DashboardLiveStats);
}

export const EMPTY_DASHBOARD_LIVE_STATS: DashboardLiveStats = {
    todayRequests: 0,
    rawSuccessRate: 0,
    avgLatencyMs: 0,
    clips: 0,
    followage: 0,
    watchtime: 0,
    so: 0,
    message: 0,
    stalker: 0,
    trends: 0,
    roulette: 0,
    russian: 0,
    magic8: 0,
    duel: 0,
    slots: 0,
    leaderboardToday: [],
    leaderboardWeekly: []
};
