/**
 * Calcula métricas de analíticas a partir de los stats crudos del usuario.
 * Función pura sin dependencias — ideal para testing.
 */
export const computeAnalyticsFromStats = (stats: Record<string, number>) => {
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
