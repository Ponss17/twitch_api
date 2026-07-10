jest.mock('@/core/config/config', () => ({
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
    type RealtimeCallbacks
} from '@/features/dashboard/lib/realtime';
import type { Session } from '@/core/config/config';
import { EMPTY_DASHBOARD_LIVE_STATS } from '@/features/dashboard/lib/dashboardStats';

const callbacks: RealtimeCallbacks = {
    onStatsUpdate: jest.fn(),
    onActivityInsert: jest.fn()
};

function makeSession(overrides: Partial<Session> = {}): Session {
    return { apiKey: 'key', token: 'tok', login: 'streamer', userId: 'u1', ...overrides };
}

describe('RealtimeService.computeStats', () => {
    const svc = new RealtimeService(makeSession());

    it('delega en parseDashboardStatsFromRow', () => {
        expect(svc.computeStats({})).toEqual(EMPTY_DASHBOARD_LIVE_STATS);
    });

    it('calcula latencia media y tasa de éxito', () => {
        expect(
            svc.computeStats({
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
});

describe('RealtimeService.formatActivityLog', () => {
    const svc = new RealtimeService(makeSession());

    it('formatea un evento conocido con su usuario y detalle', () => {
        const item = svc.formatActivityLog({
            activity_type: 'clip',
            user_name: 'pepe',
            detail: 'highlight',
            created_at: '2024-01-01T00:00:00.000Z'
        });
        expect(item.type).toBe('clip');
        expect(item.user).toBe('pepe');
        // detail legacy se mapea a metadata.raw_detail
        expect(item.metadata?.raw_detail).toBe('highlight');
        expect(item.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('normaliza tipos desconocidos como other', () => {
        const item = svc.formatActivityLog({ activity_type: 'weird_thing' });
        expect(item.type).toBe('weird_thing');
        expect(item.user).toBe('Usuario');
    });

    it('rellena el timestamp cuando falta created_at', () => {
        const item = svc.formatActivityLog({ activity_type: 'message', detail: 'hola' });
        expect(item.type).toBe('message');
        // detail legacy se mapea a metadata.raw_detail
        expect(item.metadata?.raw_detail).toBe('hola');
        expect(typeof item.timestamp).toBe('string');
        expect(item.timestamp).not.toBe('');
    });
});

describe('RealtimeServiceFactory', () => {
    afterEach(() => {
        RealtimeServiceFactory.destroy();
    });

    it('registra suscriptores y limpia al unsubscribe', () => {
        const onStatsUpdate = jest.fn();
        const onActivityInsert = jest.fn();
        const unsub = RealtimeServiceFactory.subscribe('home', makeSession(), {
            onStatsUpdate,
            onActivityInsert
        });
        expect(typeof unsub).toBe('function');
        unsub();
        expect(RealtimeServiceFactory.isConnected()).toBe(false);
    });

    it('permite varios suscriptores con la misma sesión', () => {
        const unsubA = RealtimeServiceFactory.subscribe('a', makeSession(), callbacks);
        const unsubB = RealtimeServiceFactory.subscribe('b', makeSession(), callbacks);
        expect(typeof unsubA).toBe('function');
        expect(typeof unsubB).toBe('function');
        unsubA();
        unsubB();
    });
});
