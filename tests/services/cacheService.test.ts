const mockKv = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
};

jest.mock('@/core/database/redisClient', () => ({
    kv: mockKv
}));

import * as cacheService from '../../backend/src/core/database/cacheService';

describe('cacheService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Limpiamos caché de memoria (si fuera posible, o simplemente usamos keys únicas)
    });

    it('devuelve valor de KV si no está en memoria (L2 Hit)', async () => {
        const key = 'test-key-l2';
        mockKv.get.mockResolvedValue('l2-value');

        const res = await cacheService.get(key);

        expect(res).toBe('l2-value');
        expect(mockKv.get).toHaveBeenCalledWith(`twitch_api:${key}`);
    });

    it('borra de KV al eliminar (del)', async () => {
        const key = 'to-delete';
        await cacheService.set(key, 'val');
        await cacheService.del(key);

        mockKv.get.mockResolvedValue(null);
        const res = await cacheService.get(key);

        expect(res).toBe(null);
        expect(mockKv.del).toHaveBeenCalledWith(`twitch_api:${key}`);
    });

    it('never puts a raw API key in Redis names or metadata', async () => {
        const apiKey = '11111111-1111-4111-8111-111111111111';
        await cacheService.setCachedApiUser(apiKey, {
            userId: 'user-1',
            login: 'secure',
            displayName: 'Secure',
            accessToken: 'oauth',
            refreshToken: 'refresh',
            expiresIn: 3600,
            obtainedAt: Date.now(),
            apiKey,
            isActive: true
        });

        const [redisKey, value] = mockKv.set.mock.calls.at(-1);
        expect(redisKey).not.toContain(apiKey);
        expect(JSON.stringify(value)).not.toContain(apiKey);
        expect(value).not.toHaveProperty('apiKey');
    });
});
