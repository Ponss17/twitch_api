import { buildAnalyticsCsv } from '@/features/dashboard/lib/export/exporterCsv';

describe('buildAnalyticsCsv', () => {
    it('arma resumen, comandos y serie diaria', () => {
        const csv = buildAnalyticsCsv(
            {
                todayRequests: 12,
                totalRequests: 400,
                averageLatency: '80ms',
                successRate: '99%',
                followage: 10,
                clips: 4,
                timeSeries: [
                    {
                        date: '2026-08-20',
                        command_name: 'followage',
                        requests_count: 5,
                        errors_count: 0,
                        latency_sum: 120
                    }
                ]
            },
            { login: 'streamer', exportedAt: '2026-08-21T00:00:00.000Z' }
        );

        expect(csv).toContain('login,streamer');
        expect(csv).toContain('todayRequests,12');
        expect(csv).toContain('followage,10');
        expect(csv).toContain('fecha,comando,peticiones,errores,latencia_media_ms');
        expect(csv).toContain('2026-08-20,followage,5,0,24');
    });

    it('escapa comas y comillas', () => {
        const csv = buildAnalyticsCsv(
            { averageLatency: '80,5ms', successRate: '99%"ok"' },
            { login: 'user,name', exportedAt: 't' }
        );
        expect(csv).toContain('"user,name"');
        expect(csv).toContain('averageLatencyMs,80');
        expect(csv).toContain('"99""ok"""');
    });
});
