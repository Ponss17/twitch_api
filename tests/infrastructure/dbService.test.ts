import {
    saveUser,
    getUser,
    deleteUser,
    addSystemLog,
    recordUserRequest,
    addUserActivity,
    addAuditLog,
    getAuditLogs,
    encrypt
} from '../../backend/src/core/database/dbService';
import { supabase } from '../../backend/src/core/database/supabaseClient';

const s = supabase as unknown as {
    from: jest.Mock;
    upsert: jest.Mock;
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
            const p = Promise.resolve({ data: null, error: null }) as unknown as Promise<{
                data: null;
                error: null;
            }> & {
                single: jest.Mock;
                eq: jest.Mock;
            };
            p.single = s.single;
            p.eq = s.eq;
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

    it('should delete user data from all related tables before users row', async () => {
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

        expect(s.from).toHaveBeenCalledWith('user_stats');
        expect(s.from).toHaveBeenCalledWith('user_daily_stats');
        expect(s.from).toHaveBeenCalledWith('activity_logs');
        expect(s.from).toHaveBeenCalledWith('audit_logs');
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
});
