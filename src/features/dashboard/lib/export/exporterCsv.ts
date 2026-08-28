import type { AnalyticsData } from './exporterData';

const COMMAND_KEYS = [
    'followage',
    'watchtime',
    'clips',
    'so',
    'stalker',
    'trends',
    'roulette',
    'questions',
    'magic8',
    'russian',
    'duel',
    'slots'
] as const;

function csvEscape(value: unknown): string {
    const s = String(value ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function row(cells: unknown[]): string {
    return cells.map(csvEscape).join(',');
}

function parseLatencyMs(value: unknown): number {
    if (typeof value === 'number') return Math.round(value);
    const match = String(value ?? '').match(/[\d.]+/);
    return match ? Math.round(parseFloat(match[0])) : 0;
}

interface TimeSeriesEntry {
    date?: unknown;
    command_name?: unknown;
    requests_count?: unknown;
    errors_count?: unknown;
    latency_sum?: unknown;
}

export function buildAnalyticsCsv(
    analytics: AnalyticsData,
    meta: { login: string; exportedAt: string; timezone?: string }
): string {
    const sections: string[] = [];

    sections.push([
        '# RESUMEN',
        row(['metrica', 'valor']),
        row(['login', meta.login]),
        row(['exportedAt', meta.exportedAt]),
        row(['timezone', meta.timezone ?? 'UTC']),
        row(['todayRequests', analytics.todayRequests ?? 0]),
        row(['totalRequests', analytics.totalRequests ?? 0]),
        row(['averageLatencyMs', parseLatencyMs(analytics.averageLatency)]),
        row(['successRate', String(analytics.successRate ?? '').replace('%', '').trim()]),
    ].join('\n'));

    const cmdRows: string[] = [
        '# COMANDOS',
        row(['comando', 'usos_totales']),
    ];
    for (const key of COMMAND_KEYS) {
        const value = analytics[key];
        if (typeof value === 'number' || typeof value === 'string') {
            cmdRows.push(row([key, value]));
        }
    }
    sections.push(cmdRows.join('\n'));

    const series = Array.isArray(analytics.timeSeries) ? analytics.timeSeries : [];
    if (series.length > 0) {
        const seriesRows: string[] = [
            '# SERIE TEMPORAL',
            row(['fecha', 'comando', 'peticiones', 'errores', 'latencia_media_ms']),
        ];
        for (const entry of series) {
            if (!entry || typeof entry !== 'object') continue;
            const e = entry as TimeSeriesEntry;
            const requests = Number(e.requests_count ?? 0);
            const latencySum = Number(e.latency_sum ?? 0);
            const latencyAvg = requests > 0 ? Math.round(latencySum / requests) : 0;
            seriesRows.push(row([
                e.date,
                e.command_name,
                requests,
                e.errors_count ?? 0,
                latencyAvg,
            ]));
        }
        sections.push(seriesRows.join('\n'));
    }

    return sections.join('\n\n') + '\n';
}
