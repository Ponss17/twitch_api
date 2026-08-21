import {
    saveUser,
    getUser,
    deleteUser,
    addSystemLog,
    recordUserRequest,
    addUserActivity,
    addAuditLog,
    getAuditLogs,
    getUserAuditLogs,
    encrypt
} from '../../backend/src/core/database/dbService';
import { supabase } from '../../backend/src/core/database/supabaseClient';

const s = supabase as unknown as {
    from: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
    single: jest.Mock;
    rpc: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    limit: jest.Mock;
};

// Mock de Supabase robusto
jest.mock('../../backend/src/core/database/supabaseClient', () => {
    const m: { [key: string]: jest.Mock } = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(),
        match: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ error: null })
    };

    m.from.mockReturnValue(m);
    m.select.mockReturnValue(m);
    m.delete.mockReturnValue(m);
    m.update.mockReturnValue(m);
    m.order.mockReturnValue(m);
    m.match.mockReturnValue(m);

    // Configuración de métodos que pueden ser finales o intermedios
    const setupFluent = () => {
        m.eq.mockImplementation(() => {
            const p = Promise.resolve({ data: null, error: null }) as Promise<{
                data: null;
                error: null;
            }> & {
                single: jest.Mock;
                eq: jest.Mock;
            };
            p.single = m.single;
            p.eq = m.eq;
            return p;
        });
        m.limit.mockImplementation(() => {
            const p = Promise.resolve({ data: [], error: null }) as Promise<{
                data: never[];
                error: null;
            }> & {
                eq: jest.Mock;
            };
            p.eq = m.eq;
            return p;
        });
    };

    setupFluent();
    return { supabase: m, _setupFluent: setupFluent };
});

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

jest.mock('../../backend/src/core/utils/cacheInvalidation', () => ({
    invalidateAllUserCaches: jest.fn().mockResolvedValue(undefined)
}));

describe('dbService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Restaurar implementaciones fluidas por defecto
        (supabase as unknown as { eq: jest.Mock }).eq.mockImplementation(() => {
            const p = Promise.resolve({
                data: [{ user_id: '123' }],
                error: null
            }) as unknown as Promise<{
                data: { user_id: string }[];
                error: null;
            }> & {
                single: jest.Mock;
                eq: jest.Mock;
                select: jest.Mock;
            };
            p.single = s.single;
            p.eq = s.eq;
            p.select = jest.fn().mockResolvedValue({ data: [{ user_id: '123' }], error: null });
            return p;
        });
    });

    it('should upsert user to Supabase', async () => {
        await saveUser({
            userId: '123',
            login: 'testuser',
            displayName: 'Test',
            accessToken: 'at',
            refreshToken: 'rt',
            obtainedAt: Date.now(),
            expiresIn: 3600
        });
        expect(s.from).toHaveBeenCalledWith('users');
        expect(s.upsert).toHaveBeenCalled();
    });

    it('con preservePlan actualiza sin tocar rol (no upsert)', async () => {
        await saveUser(
            {
                userId: '123',
                login: 'testuser',
                displayName: 'Test',
                accessToken: 'at',
                refreshToken: 'rt',
                obtainedAt: Date.now(),
                expiresIn: 3600,
                role: 'partner'
            },
            { preservePlan: true, preserveCreatedAt: true }
        );
        expect(s.update).toHaveBeenCalled();
        expect(s.upsert).not.toHaveBeenCalled();
        const payload = (s.update as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
        expect(payload.role).toBeUndefined();
        expect(payload.custom_rate_limit).toBeUndefined();
        expect(payload.created_at).toBeUndefined();
        expect(payload.user_id).toBeUndefined();
    });

    it('should retrieve user from Supabase', async () => {
        s.single.mockResolvedValueOnce({
            data: {
                user_id: '123',
                login: 'testuser',
                display_name: 'Test User',
                access_token: encrypt('access_token'),
                refresh_token: encrypt('refresh_token'),
                is_active: true
            },
            error: null
        });

        const user = await getUser('123');
        expect(user?.userId).toBe('123');
    });

    it('should delete user from users table', async () => {
        s.single.mockResolvedValueOnce({
            data: {
                user_id: '123',
                login: 'testuser',
                display_name: 'T',
                is_active: true,
                api_key: 'key-abc'
            },
            error: null
        });

        await deleteUser('123');

        expect(s.from).toHaveBeenCalledWith('users');
        expect(s.delete).toHaveBeenCalled();
    });

    it('should handle system logs', async () => {
        await addSystemLog('info', 'test');
        expect(s.insert).toHaveBeenCalled();
    });

    it('should handle user stats', async () => {
        await recordUserRequest('123', 50, true);
        expect(s.rpc).toHaveBeenCalled();
    });

    it('should handle user activity', async () => {
        await addUserActivity('123', { type: 'clip', user: 'u', metadata: { title: 'd' } });
        expect(s.insert).toHaveBeenCalled();
    });

    it('should handle audit logs', async () => {
        await addAuditLog('api_key_regenerated', '123', 'admin', { r: 't' });
        expect(s.insert).toHaveBeenCalled();
    });

    it('should retrieve audit logs', async () => {
        s.limit.mockImplementationOnce(() =>
            Promise.resolve({
                data: [{ action: 'test', user_id: '123', created_at: new Date().toISOString() }],
                error: null
            })
        );

        const logs = await getAuditLogs(1);
        expect(logs[0].action).toBe('test');
    });

    it('should retrieve user-scoped audit logs without raw metadata', async () => {
        const range = jest.fn().mockResolvedValue({
            data: [
                {
                    action: 'session_login',
                    created_at: '2026-08-21T12:00:00.000Z',
                    metadata: { discordId: 'should-not-leak' }
                },
                {
                    action: 'stats_cleared',
                    created_at: '2026-08-21T11:00:00.000Z',
                    metadata: { stats: true, questions: false }
                },
                {
                    action: 'user_blocked',
                    created_at: '2026-08-21T10:00:00.000Z',
                    metadata: {}
                }
            ],
            error: null,
            count: 2
        });
        s.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({ range })
                    })
                })
            })
        });

        const result = await getUserAuditLogs('123', 1);
        expect(range).toHaveBeenCalledWith(0, 19);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.total).toBe(2);
        expect(result.logs).toEqual([
            { action: 'session_login', createdAt: '2026-08-21T12:00:00.000Z' },
            {
                action: 'stats_cleared',
                createdAt: '2026-08-21T11:00:00.000Z',
                scopes: { stats: true, questions: false }
            }
        ]);
        expect(result.logs[0]).not.toHaveProperty('metadata');
    });
});
