// Mapeo declarativo de tipos de actividad a texto formateado para el dashboard
const LOG_FORMATTERS: Record<string, (log: { user: string; detail?: string }) => string> = {
    clip: (log) => `📺 Nuevo clip creado por @${log.user} (${log.detail})`,
    followage: (log) => `⏱️ @${log.user} revisó su followage en ${log.detail}`,
    shoutout: (log) => `🗣️ Shoutout de @${log.user}`,
    message: (log) => `💬 Mensaje enviado: "${log.detail}"`,
    russian: (log) => `🔫 @${log.user} jugó la Ruleta Rusa`,
    magic8: (log) => `🎱 @${log.user} preguntó a la Bola 8`,
    duel: (log) => `⚔️ @${log.user} inició un duelo con @${log.detail}`,
    stalker: (log) => `🕵️ @${log.user} inició escaneo de Stalker`,
    trends: (log) => `📊 @${log.user} inició rastreo de Tendencias`,
    roulette: (log) => `🎲 @${log.user} consultó la Ruleta de Chatters`
};

export const formatActivityLog = (log: { type: string; user: string; detail?: string }): string => {
    const formatter = LOG_FORMATTERS[log.type];
    return formatter ? formatter(log) : `🔹 Actividad: ${log.type} por @${log.user}`;
};

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
