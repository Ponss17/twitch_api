jest.mock('@/lib/config', () => ({
    API_ENDPOINTS: { REALTIME_TOKEN: '/api/twitch/system/realtime-token' },
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key'
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({}))
}));

import {
    RealtimeService,
    RealtimeServiceFactory,
    type HomeStats,
    type RealtimeCallbacks
} from '@/lib/realtimeService';
import type { Session } from '@/lib/config';
import type { ActivityLogItem } from '@/lib/activityLogDisplay';

const callbacks: RealtimeCallbacks = {
    onStatsUpdate: jest.fn(),
    onActivityInsert: jest.fn()
};

function makeSession(overrides: Partial<Session> = {}): Session {
    return { apiKey: 'key', token: 'tok', login: 'streamer', userId: 'u1', ...overrides };
}

// Acceso a la lógica pura (privada) sin abrir conexión real.
function privates(svc: RealtimeService) {
    return svc as unknown as {
        formatActivityLog: (raw: Record<string, unknown>) => ActivityLogItem;
        computeStats: (raw: Record<string, unknown>) => HomeStats;
    };
}

describe('RealtimeService.computeStats', () => {
    const svc = privates(new RealtimeService(makeSession(), callbacks));

    it('devuelve ceros cuando no hay peticiones', () => {
        expect(svc.computeStats({})).toEqual({
            todayRequests: 0,
            rawSuccessRate: 0,
            avgLatencyMs: 0
        });
    });

    it('calcula latencia media y tasa de éxito', () => {
        expect(
            svc.computeStats({
                today_requests: 100,
                today_errors: 5,
                today_latency: 5000
            })
        ).toEqual({
            todayRequests: 100,
            rawSuccessRate: 95,
            avgLatencyMs: 50
        });
    });

    it('redondea la latencia media al entero más cercano', () => {
        const stats = svc.computeStats({ today_requests: 3, today_latency: 100 });
        expect(stats.avgLatencyMs).toBe(33);
    });
});

describe('RealtimeService.formatActivityLog', () => {
    const svc = privates(new RealtimeService(makeSession(), callbacks));

    it('formatea un evento conocido con su usuario y detalle', () => {
        const item = svc.formatActivityLog({
            activity_type: 'clip',
            user_name: 'pepe',
            detail: 'highlight',
            created_at: '2024-01-01T00:00:00.000Z'
        });
        expect(item.action).toContain('@pepe');
        expect(item.action).toContain('highlight');
        expect(item.user).toBe('pepe');
        expect(item.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('usa un texto genérico para tipos desconocidos', () => {
        const item = svc.formatActivityLog({ activity_type: 'weird_thing' });
        expect(item.action).toContain('weird_thing');
        expect(item.user).toBe('Usuario');
    });

    it('rellena el timestamp cuando falta created_at', () => {
        const item = svc.formatActivityLog({ activity_type: 'message', detail: 'hola' });
        expect(typeof item.timestamp).toBe('string');
        expect(item.timestamp).not.toBe('');
    });
});

describe('RealtimeServiceFactory', () => {
    afterEach(() => {
        RealtimeServiceFactory.destroy();
    });

    it('reutiliza la misma instancia para una sesión idéntica', () => {
        const a = RealtimeServiceFactory.getInstance(makeSession(), callbacks);
        const b = RealtimeServiceFactory.getInstance(makeSession(), callbacks);
        expect(b).toBe(a);
    });

    it('crea una nueva instancia cuando cambia el token', () => {
        const a = RealtimeServiceFactory.getInstance(makeSession({ token: 'old' }), callbacks);
        const b = RealtimeServiceFactory.getInstance(makeSession({ token: 'new' }), callbacks);
        expect(b).not.toBe(a);
    });

    it('crea una nueva instancia cuando cambia el userId', () => {
        const a = RealtimeServiceFactory.getInstance(makeSession({ userId: 'u1' }), callbacks);
        const b = RealtimeServiceFactory.getInstance(makeSession({ userId: 'u2' }), callbacks);
        expect(b).not.toBe(a);
    });
});
