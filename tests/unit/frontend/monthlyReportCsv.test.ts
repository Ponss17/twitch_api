import { buildMonthlyReportCsv } from '@/features/dashboard/reports/reportDownload';
import type { MonthlyReportSummary } from '@/features/dashboard/reports/reportsApi';

const summary: MonthlyReportSummary = {
    yearMonth: '2026-08',
    timezone: 'America/Mexico_City',
    totalRequests: 10,
    totalErrors: 1,
    successRate: 90,
    avgLatencyMs: 40,
    uniqueCommands: 1,
    commands: [{ name: 'followage', requests: 10, errors: 1, avgLatencyMs: 40 }],
    daily: [{ date: '2026-08-01', requests: 10, errors: 1 }],
    topViewers: [{ user_name: 'viewer1', total: 3, last_seen: '2026-08-01T00:00:00.000Z' }],
    previous: {
        yearMonth: '2026-07',
        totalRequests: 5,
        successRate: 100,
        avgLatencyMs: 30,
        requestsDelta: 5
    }
};

describe('buildMonthlyReportCsv', () => {
    it('incluye resumen y no secretos', () => {
        const csv = buildMonthlyReportCsv(summary, {
            login: 'streamer',
            exportedAt: '2026-09-01T00:00:00.000Z'
        });
        expect(csv).toContain('2026-08');
        expect(csv).toContain('followage');
        expect(csv).toContain('viewer1');
        expect(csv).not.toContain('apiKey');
        expect(csv).not.toContain('token');
    });
});
