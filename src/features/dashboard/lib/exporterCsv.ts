import type { AnalyticsData } from './exporterData';

const COMMAND_KEYS = [
    'followage',
    'watchtime',
    'clips',
    'so',
    'message',
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

function line(cells: unknown[]): string {
    return cells.map(csvEscape).join(',');
}

interface TimeSeriesRow {
    date?: unknown;
    command_name?: unknown;
    requests_count?: unknown;
    errors_count?: unknown;
    latency_sum?: unknown;
}

export function buildAnalyticsCsv(
    analytics: AnalyticsData,
    meta: { login: string; exportedAt: string }
): string {
    const rows: string[] = [
        line(['metric', 'value']),
        line(['login', meta.login]),
        line(['exportedAt', meta.exportedAt]),
        line(['todayRequests', analytics.todayRequests ?? 0]),
        line(['totalRequests', analytics.totalRequests ?? 0]),
        line(['averageLatency', analytics.averageLatency ?? '']),
        line(['successRate', analytics.successRate ?? '']),
        '',
        line(['command', 'requests'])
    ];

    for (const key of COMMAND_KEYS) {
        const value = analytics[key];
        if (typeof value === 'number' || typeof value === 'string') {
            rows.push(line([key, value]));
        }
    }

    const series = Array.isArray(analytics.timeSeries) ? analytics.timeSeries : [];
    if (series.length > 0) {
        rows.push('');
        rows.push(line(['date', 'command', 'requests', 'errors', 'latency_sum']));
        for (const entry of series) {
            if (!entry || typeof entry !== 'object') continue;
            const row = entry as TimeSeriesRow;
            rows.push(
                line([
                    row.date,
                    row.command_name,
                    row.requests_count,
                    row.errors_count,
                    row.latency_sum
                ])
            );
        }
    }

    return `${rows.join('\n')}\n`;
}
