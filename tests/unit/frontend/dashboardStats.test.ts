import {
    EMPTY_DASHBOARD_LIVE_STATS,
    parseDashboardStatsFromRow
} from '@/lib/dashboardStats';

describe('parseDashboardStatsFromRow', () => {
    it('devuelve ceros cuando no hay peticiones', () => {
        expect(parseDashboardStatsFromRow({})).toEqual(EMPTY_DASHBOARD_LIVE_STATS);
    });

    it('calcula latencia media y tasa de éxito', () => {
        expect(
            parseDashboardStatsFromRow({
                today_requests: 100,
                today_errors: 5,
                today_latency: 5000
            })
        ).toMatchObject({
            todayRequests: 100,
            rawSuccessRate: 95,
            avgLatencyMs: 50
        });
    });

    it('redondea la latencia media al entero más cercano', () => {
        const stats = parseDashboardStatsFromRow({ today_requests: 3, today_latency: 100 });
        expect(stats.avgLatencyMs).toBe(33);
    });

    it('mapea columnas clips_count a clips', () => {
        expect(
            parseDashboardStatsFromRow({
                clips_count: 7,
                followage_count: 2,
                duel_count: 1
            })
        ).toMatchObject({
            clips: 7,
            followage: 2,
            duel: 1
        });
    });
});
