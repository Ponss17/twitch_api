const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
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

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as statsService from '../../backend/src/core/database/statsService';

describe('statsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.upsert.mockResolvedValue({ error: null });
        mockSupabase.rpc.mockResolvedValue({ error: null });
    });

    describe('incrementUserStats', () => {
        it('ignora comandos desconocidos sin hacer queries', async () => {
            await statsService.incrementUserStats('user1', 'comandoInexistente');
            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('llama rpc increment_user_stat con la columna correcta', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: null });
            await statsService.incrementUserStats('user1', 'clips');
            expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_user_stat', {
                p_user_id: 'user1',
                p_column: 'clips_count'
            });
        });
    });

    describe('recordUserRequest', () => {
        it('llama rpc record_user_request con los parámetros correctos', async () => {
            mockSupabase.upsert.mockResolvedValue({ error: null });
            mockSupabase.rpc.mockResolvedValue({ error: null });

            await statsService.recordUserRequest('user1', 123, true);

            expect(mockSupabase.rpc).toHaveBeenCalledWith('record_user_request', {
                p_user_id: 'user1',
                p_latency: 123,
                p_success: true
            });
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
        it('elimina stats y logs en paralelo', async () => {
            const deleteMock = { eq: jest.fn().mockResolvedValue({ error: null }) };
            mockSupabase.from.mockReturnValue({
                delete: jest.fn().mockReturnValue(deleteMock)
            });

            await statsService.clearUserStatsAndLogs('user1');
            expect(mockSupabase.from).toHaveBeenCalledWith('user_stats');
            expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs');
        });
    });
});
