import {
    EMPTY_DASHBOARD_LIVE_STATS,
    isStatsDateOutdated,
    parseDashboardStatsFromRow,
    sumDashboardCategoryUsage
} from '@/features/dashboard/lib/dashboardStats';

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

    it('pone contadores en cero si last_stats_date es de otro día', () => {
        expect(
            parseDashboardStatsFromRow(
                {
                    last_stats_date: '2020-01-01',
                    today_requests: 9,
                    clips_count: 5,
                    stalker_count: 25
                },
                { todayLocal: '2026-07-02' }
            )
        ).toMatchObject({
            todayRequests: 0,
            clips: 0,
            stalker: 0
        });
    });
});

describe('isStatsDateOutdated', () => {
    it('detecta fecha anterior al día local', () => {
        expect(isStatsDateOutdated('2020-01-01', '2026-07-02')).toBe(true);
        expect(isStatsDateOutdated('2026-07-02', '2026-07-02')).toBe(false);
    });
});

describe('sumDashboardCategoryUsage', () => {
    it('suma comandos, herramientas y minijuegos como en el perfil', () => {
        expect(
            sumDashboardCategoryUsage({
                clips: 2,
                followage: 1,
                so: 1,
                message: 1,
                stalker: 10,
                trends: 10,
                roulette: 5,
                russian: 0,
                magic8: 0,
                duel: 0
            })
        ).toBe(30);
    });

    it('devuelve 0 sin datos', () => {
        expect(sumDashboardCategoryUsage({})).toBe(0);
    });
});
