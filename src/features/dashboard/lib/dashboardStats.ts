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
    options?: { todayLocal?: string }
): DashboardLiveStats {
    const isOutdated = isStatsDateOutdated(raw.last_stats_date, options?.todayLocal);

    const todayRequests = isOutdated ? 0 : Number(raw.today_requests ?? 0);
    const todayErrors = isOutdated ? 0 : Number(raw.today_errors ?? 0);
    const todayLatency = isOutdated ? 0 : Number(raw.today_latency ?? 0);
    const avgLatencyMs = todayRequests > 0 ? Math.round(todayLatency / todayRequests) : 0;
    const rawSuccessRate =
        todayRequests > 0
            ? parseFloat(((1 - todayErrors / todayRequests) * 100).toFixed(1))
            : 0;

    const counts = {} as Pick<
        DashboardLiveStats,
        'clips' | 'followage' | 'so' | 'message' | 'stalker' | 'trends' | 'roulette' | 'russian' | 'magic8' | 'duel'
    >;

    for (const [column, key] of Object.entries(COUNT_COLUMNS)) {
        const countKey = key as keyof typeof counts;
        counts[countKey] = isOutdated ? 0 : Number(raw[column] ?? raw[countKey] ?? 0);
    }

    return {
        todayRequests,
        rawSuccessRate,
        avgLatencyMs,
        ...counts
    };
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
