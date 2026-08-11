const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    head: jest.fn().mockReturnThis(),
    rpc: jest.fn()
};

jest.mock('../../backend/src/core/database/supabaseClient', () => ({
    supabase: mockSupabase
}));

jest.mock('../../backend/src/core/database/cacheService', () => ({
    getStatsRevision: jest.fn().mockResolvedValue(0),
    bumpStatsRevision: jest.fn().mockResolvedValue(undefined),
    invalidateDashboardAnalytics: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as statsService from '../../backend/src/core/database/statsService';
import * as cacheService from '../../backend/src/core/database/cacheService';
import { clearUserTimezone } from '../../backend/src/core/database/userTimezoneCache';

describe('statsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearUserTimezone('user1');
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.upsert.mockResolvedValue({ error: null });
        mockSupabase.rpc.mockResolvedValue({ error: null });
        mockSupabase.single.mockResolvedValue({ data: { timezone: 'UTC' }, error: null });
    });

    describe('recordUserRequest', () => {
        it('llama rpc log_user_request con los parámetros correctos', async () => {
            mockSupabase.upsert.mockResolvedValue({ error: null });
            mockSupabase.rpc.mockResolvedValue({ error: null });

            await statsService.recordUserRequest('user1', 123, true);

            expect(mockSupabase.rpc).toHaveBeenCalledWith('log_user_request', {
                p_user_id: 'user1',
                p_command: null,
                p_latency: 123,
                p_success: true,
                p_local_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
            });
        });

        it('pasa el comando cuando se indica incrementStat', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: null });
            await statsService.recordUserRequest('user1', 50, true, 'clips');
            expect(mockSupabase.rpc).toHaveBeenCalledWith(
                'log_user_request',
                expect.objectContaining({ p_command: 'clips' })
            );
        });

        it('no lanza excepción si el rpc devuelve error', async () => {
            mockSupabase.upsert.mockResolvedValue({ error: null });
            mockSupabase.rpc.mockResolvedValue({ error: { message: 'db error' } });

            await expect(
                statsService.recordUserRequest('user1', 100, false)
            ).resolves.not.toThrow();
        });
    });

    describe('clearUserStatsAndLogs', () => {
        it('usa la limpieza transaccional cuando está disponible', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: null });
            await statsService.clearUserStatsAndLogs('user1');
            expect(mockSupabase.rpc).toHaveBeenCalledWith('clear_user_stats_and_logs', {
                p_user_id: 'user1'
            });
            expect(cacheService.bumpStatsRevision).toHaveBeenCalledWith('user1');
        });

        it('no confirma éxito si una tabla falla en el fallback', async () => {
            mockSupabase.rpc.mockResolvedValue({
                error: { code: 'PGRST202', message: 'clear_user_stats_and_logs missing' }
            });
            const eq = jest.fn()
                .mockResolvedValueOnce({ error: null })
                .mockResolvedValueOnce({ error: { message: 'daily failed' } })
                .mockResolvedValueOnce({ error: null });
            mockSupabase.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({ eq })
            });

            await expect(statsService.clearUserStatsAndLogs('user1')).rejects.toThrow('Limpieza incompleta');
            expect(cacheService.bumpStatsRevision).not.toHaveBeenCalled();
        });
    });
});
