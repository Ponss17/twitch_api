import { Request, Response } from 'express';
import { kv } from '@vercel/kv';
import { globalRateLimiter } from '../../backend/src/core/middleware/redisRateLimiter';

jest.mock('@/core/database/cacheService', () => ({
    isKvWriteAvailable: jest.fn().mockReturnValue(true)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    }
}));

jest.mock('@/core/utils/routeHelpers', () => ({
    isPublicRoute: jest.fn().mockReturnValue(false),
    isBotCommand: jest.fn().mockReturnValue(false),
    isApiRoute: jest.fn((path: string) => path.startsWith('/api') || path.startsWith('/twitch'))
}));

jest.mock('@vercel/kv', () => {
    const incrMock = jest.fn((_key: string) => Promise.resolve(0));
    return {
        kv: {
            incr: incrMock,
            expire: jest.fn(),
            pipeline: jest.fn().mockReturnValue({
                incr: jest.fn().mockReturnThis(),
                expire: jest.fn().mockReturnThis(),
                exec: jest.fn().mockImplementation(async () => {
                    const val = await incrMock('test');
                    return [val, 1];
                })
            })
        }
    };
});

describe('globalRateLimiter', () => {
    let req: Request;
    let res: Response;
    let next: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        req = { originalUrl: '/api/test', ip: '1.2.3.4', headers: {} } as unknown as Request;
        res = {
            locals: {},
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        } as unknown as Response;
        next = jest.fn();
    });

    it('permite la petición si está bajo el límite', async () => {
        (kv.incr as jest.Mock).mockResolvedValue(5);
        await globalRateLimiter(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('bloquea con 429 si supera el límite (IP anónima vía KV)', async () => {
        (kv.incr as jest.Mock).mockResolvedValue(2000);

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(next).not.toHaveBeenCalled();
    });

    it('bloquea sesión OAuth en memoria si supera el límite', async () => {
        (req as Request & { userId: string }).userId = 'user1';

        for (let i = 0; i < 1001; i += 1) {
            await globalRateLimiter(req, res, next);
        }

        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('usa el límite de API Key si está presente', async () => {
        (kv.incr as jest.Mock).mockResolvedValue(51);
        res.locals.isApiKeyRequest = true;
        res.locals.apiUser = { userId: 'api-user', customRateLimit: 50 } as never;

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
    });
});
