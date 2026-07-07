/** Categorías del resumen de actividad y contadores por recurso. */
export const DASHBOARD_USAGE_CATEGORIES = [
    { id: 'cat-commands', label: 'Comandos', keys: ['clips', 'followage', 'so', 'message'] as const },
    { id: 'cat-tools', label: 'Herramientas', keys: ['stalker', 'trends', 'roulette'] as const },
    { id: 'cat-minigames', label: 'Minijuegos', keys: ['russian', 'magic8', 'duel'] as const }
] as const;

export type DashboardUsageKey = (typeof DASHBOARD_USAGE_CATEGORIES)[number]['keys'][number];

const DASHBOARD_USAGE_KEYS: readonly DashboardUsageKey[] = DASHBOARD_USAGE_CATEGORIES.flatMap(
    (cat) => cat.keys
);

function getStatsLocalDateString(timeZone?: string): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

/** `last_stats_date` anterior al día local efectivo → contadores del día en cero. */
export function isStatsDateOutdated(
    lastStatsDate: unknown,
    todayLocal = getStatsLocalDateString()
): boolean {
    return typeof lastStatsDate === 'string' && lastStatsDate.length > 0 && lastStatsDate < todayLocal;
}

/** Suma de usos del día por recurso — misma métrica que el resumen del perfil. */
export function sumDashboardCategoryUsage(
    stats: Partial<Pick<DashboardLiveStats, DashboardUsageKey>>
): number {
    return DASHBOARD_USAGE_KEYS.reduce((sum, key) => sum + (stats[key] ?? 0), 0);
}

/** Stats en vivo desde `user_stats` (Realtime o API). */
export interface DashboardLiveStats {
    todayRequests: number;
    rawSuccessRate: number;
    avgLatencyMs: number;
    clips: number;
    followage: number;
    so: number;
    message: number;
    stalker: number;
    trends: number;
    roulette: number;
    russian: number;
    magic8: number;
    duel: number;
    timeSeries?: Array<{
        date: string;
        requests_count: number;
        errors_count: number;
        latency_sum: number;
        command_name: string;
    }>;
}

const COUNT_COLUMNS: Record<string, keyof DashboardLiveStats> = {
    clips_count: 'clips',
    followage_count: 'followage',
    so_count: 'so',
    message_count: 'message',
    stalker_count: 'stalker',
    trends_count: 'trends',
    roulette_count: 'roulette',
    russian_count: 'russian',
    magic8_count: 'magic8',
    duel_count: 'duel'
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
    const isPartial = options?.isPartialUpdate && !isOutdated;

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
        result.timeSeries = raw.timeSeries as Array<{
            date: string;
            requests_count: number;
            errors_count: number;
            latency_sum: number;
            command_name: string;
        }>;
    }

    return isPartial ? result : (result as DashboardLiveStats);
}

export const EMPTY_DASHBOARD_LIVE_STATS: DashboardLiveStats = {
    todayRequests: 0,
    rawSuccessRate: 0,
    avgLatencyMs: 0,
    clips: 0,
    followage: 0,
    so: 0,
    message: 0,
    stalker: 0,
    trends: 0,
    roulette: 0,
    russian: 0,
    magic8: 0,
    duel: 0
};
