import {
    EMPTY_DASHBOARD_LIVE_STATS,
    getTodayRequestsTotal,
    isStatsDateOutdated,
    mergeDashboardStats,
    mergeTimeSeriesPatch,
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

    it('en patch parcial obsoleto no toca el estado (no wipe a 0)', () => {
        expect(
            parseDashboardStatsFromRow(
                {
                    last_stats_date: '2020-01-01',
                    today_requests: 9,
                    clips_count: 5
                },
                { todayLocal: '2026-07-02', isPartialUpdate: true }
            )
        ).toEqual({});
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
                watchtime: 0,
                so: 1,
                message: 1,
                stalker: 10,
                trends: 10,
                roulette: 5,
                russian: 0,
                magic8: 0,
                duel: 0,
                slots: 0
            })
        ).toBe(30);
    });

    it('devuelve 0 sin datos', () => {
        expect(sumDashboardCategoryUsage({})).toBe(0);
    });
});

describe('getTodayRequestsTotal', () => {
    it('usa today_requests cuando es mayor que la suma por comando', () => {
        expect(
            getTodayRequestsTotal({
                todayRequests: 12,
                followage: 2,
                clips: 1
            })
        ).toBe(12);
    });

    it('complementa con la suma por comando si today_requests va rezagado', () => {
        expect(
            getTodayRequestsTotal({
                todayRequests: 1,
                followage: 2,
                clips: 1
            })
        ).toBe(3);
    });
});

describe('mergeTimeSeriesPatch', () => {
    it('agrega una fila nueva al timeSeries', () => {
        expect(
            mergeTimeSeriesPatch(undefined, {
                date: '2026-07-08',
                command_name: 'followage',
                requests_count: 3,
                errors_count: 0,
                latency_sum: 120
            })
        ).toEqual([
            {
                date: '2026-07-08',
                command_name: 'followage',
                requests_count: 3,
                errors_count: 0,
                latency_sum: 120
            }
        ]);
    });

    it('actualiza una fila existente por fecha y comando', () => {
        const prev = [
            {
                date: '2026-07-08',
                command_name: 'followage',
                requests_count: 1,
                errors_count: 0,
                latency_sum: 40
            }
        ];

        expect(
            mergeTimeSeriesPatch(prev, {
                date: '2026-07-08',
                command_name: 'followage',
                requests_count: 4,
                errors_count: 1,
                latency_sum: 200
            })
        ).toEqual([
            {
                date: '2026-07-08',
                command_name: 'followage',
                requests_count: 4,
                errors_count: 1,
                latency_sum: 200
            }
        ]);
    });
});

describe('mergeDashboardStats', () => {
    it('fusiona contadores y parches de timeSeries en realtime', () => {
        const prev = {
            ...EMPTY_DASHBOARD_LIVE_STATS,
            followage: 1,
            timeSeries: [
                {
                    date: '2026-07-08',
                    command_name: 'followage',
                    requests_count: 1,
                    errors_count: 0,
                    latency_sum: 40
                }
            ]
        };

        expect(
            mergeDashboardStats(prev, {
                followage: 2,
                __dailyStatsPatch: {
                    date: '2026-07-08',
                    command_name: 'followage',
                    requests_count: 2,
                    errors_count: 0,
                    latency_sum: 80
                }
            })
        ).toMatchObject({
            followage: 2,
            todayRequests: 2,
            timeSeries: [
                {
                    date: '2026-07-08',
                    command_name: 'followage',
                    requests_count: 2,
                    errors_count: 0,
                    latency_sum: 80
                }
            ]
        });
    });

    it('actualiza todayRequests cuando llega today_requests por realtime', () => {
        const prev = {
            ...EMPTY_DASHBOARD_LIVE_STATS,
            followage: 2,
            todayRequests: 2
        };

        expect(
            mergeDashboardStats(prev, {
                todayRequests: 5,
                rawSuccessRate: 100,
                avgLatencyMs: 40
            })
        ).toMatchObject({
            todayRequests: 5,
            followage: 2
        });
    });
});
