const mockKv = {
    incr: jest.fn(),
    expire: jest.fn()
};

jest.mock('@vercel/kv', () => ({
    kv: mockKv
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { warn: jest.fn(), error: jest.fn() }
}));

jest.mock('@/core/utils/routeHelpers', () => ({
    isPublicRoute: jest.fn().mockReturnValue(false)
}));

import { globalRateLimiter } from '../../src/core/middleware/redisRateLimiter';

describe('globalRateLimiter', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { originalUrl: '/api/test', ip: '1.2.3.4' };
        res = {
            locals: {},
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('permite la petición si está bajo el límite', async () => {
        mockKv.incr.mockResolvedValue(5); // 5 de 1000
        await globalRateLimiter(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    });

    it('bloquea con 429 si supera el límite', async () => {
        mockKv.incr.mockResolvedValue(2000); // Supera los 1000 del dashboard
        req.userId = 'user1';

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(next).not.toHaveBeenCalled();
    });

    it('usa el límite de API Key si está presente', async () => {
        res.locals.isApiKeyRequest = true;
        res.locals.apiUser = { userId: 'api-user', customRateLimit: 50 };
        mockKv.incr.mockResolvedValue(51);

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
    });
});
