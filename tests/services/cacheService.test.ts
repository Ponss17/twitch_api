const mockKv = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
};

jest.mock('@vercel/kv', () => ({
    kv: mockKv
}));

import * as cacheService from '../../src/core/database/cacheService';

describe('cacheService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Limpiamos caché de memoria (si fuera posible, o simplemente usamos keys únicas)
    });

    it('devuelve valor de KV si no está en memoria (L1 Miss, L2 Hit)', async () => {
        const key = 'test-key-l2';
        mockKv.get.mockResolvedValue('l2-value');

        const res = await cacheService.get(key);

        expect(res).toBe('l2-value');
        expect(mockKv.get).toHaveBeenCalledWith(key);
    });

    it('devuelve valor de memoria si ya se cargó (L1 Hit)', async () => {
        const key = 'test-key-l1';
        mockKv.get.mockResolvedValueOnce('first-time');

        await cacheService.get(key); // Llenamos L1
        const res = await cacheService.get(key); // Segunda llamada

        expect(res).toBe('first-time');
        expect(mockKv.get).toHaveBeenCalledTimes(1); // Solo consultó KV una vez
    });

    it('borra ambos niveles al eliminar (del)', async () => {
        const key = 'to-delete';
        await cacheService.set(key, 'val');
        await cacheService.del(key);

        mockKv.get.mockResolvedValue(null);
        const res = await cacheService.get(key);

        expect(res).toBe(null);
        expect(mockKv.del).toHaveBeenCalledWith(key);
    });
});
