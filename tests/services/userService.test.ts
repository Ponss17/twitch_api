const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    upsert: jest.fn().mockResolvedValue({ error: null })
};

jest.mock('../../src/core/database/supabaseClient', () => ({
    supabase: mockSupabase
}));

const mockCache = {
    get: jest.fn(),
    set: jest.fn()
};

jest.mock('../../src/core/database/cacheService', () => ({
    get: mockCache.get,
    set: mockCache.set
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as userService from '../../src/core/database/userService';

describe('userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
    });

    describe('getUserByLogin', () => {
        it('usa la caché si el usuario ya está ahí', async () => {
            const mockUser = { userId: '123', login: 'test' };
            mockCache.get.mockResolvedValue(mockUser);

            const res = await userService.getUserByLogin('test');

            expect(res).toBe(mockUser);
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('consulta base de datos y llena caché si no está ahí', async () => {
            mockCache.get.mockResolvedValue(null);
            mockSupabase.single.mockResolvedValue({
                data: { user_id: '123', login: 'test', display_name: 'Test' },
                error: null
            });

            const res = await userService.getUserByLogin('test');

            expect(res?.userId).toBe('123');
            expect(mockCache.set).toHaveBeenCalledWith(
                expect.stringContaining('test'),
                expect.any(Object),
                900 // 15 min (extendido para reducir queries a Supabase por comandos del bot)
            );
        });
    });

    describe('getUserByApiKey', () => {
        it('retorna null si el usuario está marcado como inactivo', async () => {
            mockSupabase.single.mockResolvedValue({
                data: { user_id: '123', is_active: false, login: 'blocked' },
                error: null
            });

            const res = await userService.getUserByApiKey('key1');

            expect(res).toBeNull();
        });
    });
});
