const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    upsert: jest.fn().mockResolvedValue({ error: null })
};

jest.mock('../../backend/src/core/database/supabaseClient', () => ({
    supabase: mockSupabase
}));

const mockCache = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidateApiKeyCache: jest.fn().mockResolvedValue(undefined)
};

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: mockCache.get,
    set: mockCache.set,
    del: mockCache.del,
    invalidateApiKeyCache: mockCache.invalidateApiKeyCache
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as userService from '../../backend/src/core/database/userService';
import { encrypt } from '../../backend/src/core/database/cryptoService';
import { apiKeyLookupHash } from '../../backend/src/core/utils/apiKeySecurity';

describe('userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.in.mockReturnThis();
        mockSupabase.limit.mockReturnThis();
    });

    describe('getUserByLogin', () => {
        it('usa la caché si el usuario ya está ahí', async () => {
            const mockUser = { userId: '123', login: 'test' };
            mockCache.get.mockResolvedValue(mockUser);

            const res = await userService.getUserByLogin('test');

            expect(res).toBe(mockUser);
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('never writes plaintext OAuth tokens or API keys to Redis L2', async () => {
            mockCache.get.mockResolvedValue(null);
            mockSupabase.single.mockResolvedValue({
                data: {
                    user_id: 'secure-user',
                    login: 'secure',
                    display_name: 'Secure',
                    access_token: encrypt('plain-access-token'),
                    refresh_token: encrypt('plain-refresh-token'),
                    api_key: encrypt('11111111-1111-4111-8111-111111111111'),
                    api_key_hash: apiKeyLookupHash('11111111-1111-4111-8111-111111111111')
                },
                error: null
            });

            const user = await userService.getUserByLogin('secure');

            expect(user?.accessToken).toBe('plain-access-token');
            const cachedUser = mockCache.set.mock.calls.at(-1)?.[1];
            expect(cachedUser.accessToken).not.toBe('plain-access-token');
            expect(cachedUser.refreshToken).not.toBe('plain-refresh-token');
            expect(cachedUser.apiKey).not.toBe('11111111-1111-4111-8111-111111111111');
            expect(JSON.stringify(cachedUser)).not.toContain('plain-access-token');
            expect(JSON.stringify(cachedUser)).not.toContain('plain-refresh-token');
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
            mockSupabase.maybeSingle.mockResolvedValue({
                data: { user_id: '123', is_active: false, login: 'blocked' },
                error: null
            });

            const res = await userService.getUserByApiKey('key1');

            expect(res).toBeNull();
        });

        it('looks up API keys by HMAC rather than plaintext', async () => {
            const rawKey = '22222222-2222-4222-8222-222222222222';
            mockSupabase.maybeSingle.mockResolvedValue({
                data: {
                    user_id: '123',
                    login: 'active',
                    display_name: 'Active',
                    api_key: encrypt(rawKey),
                    api_key_hash: apiKeyLookupHash(rawKey),
                    is_active: true
                },
                error: null
            });

            const user = await userService.getUserByApiKey(rawKey);

            expect(mockSupabase.eq).toHaveBeenCalledWith('api_key_hash', apiKeyLookupHash(rawKey));
            expect(mockSupabase.eq).not.toHaveBeenCalledWith('api_key_hash', rawKey);
            expect(user?.apiKey).toBe(rawKey);
        });
    });
});
