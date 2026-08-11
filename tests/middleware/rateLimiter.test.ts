import { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { kv } from '@/core/database/redisClient';
import {
    globalRateLimiter,
    preAuthRateLimiter
} from '../../backend/src/core/middleware/redisRateLimiter';

jest.mock('@/core/database/cacheService', () => ({
    isKvWriteAvailable: jest.fn().mockReturnValue(true)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    }
}));

jest.mock('@/core/utils/routeHelpers', () => ({
    isPublicRoute: jest.fn().mockReturnValue(false),
    isPublicHtmlRoute: jest.fn().mockReturnValue(false),
    isBotCommand: jest.fn().mockReturnValue(false),
    isApiRoute: jest.fn((path: string) => path.startsWith('/api') || path.startsWith('/twitch'))
}));

jest.mock('@/core/database/redisClient', () => {
    const incrMock = jest.fn((_key: string) => Promise.resolve(0));
    return {
        kv: {
            incr: incrMock,
            expire: jest.fn(),
            eval: jest.fn().mockImplementation((_script, keys) => incrMock(keys[0]))
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

    it('bloquea sesión OAuth vía KV si supera el límite', async () => {
        (req as Request & { userId: string }).userId = 'user1';
        (kv.incr as jest.Mock).mockResolvedValue(501);

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(next).not.toHaveBeenCalled();
    });

    it('usa el límite de API Key si está presente', async () => {
        (kv.incr as jest.Mock).mockResolvedValue(51);
        res.locals.isApiKeyRequest = true;
        res.locals.apiUser = { userId: 'api-user', customRateLimit: 50 } as never;

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('usa el límite del rol cuando no hay override personalizado', async () => {
        (kv.incr as jest.Mock).mockResolvedValue(301);
        res.locals.isApiKeyRequest = true;
        res.locals.apiUser = { userId: 'vip-user', role: 'vip' } as never;

        await globalRateLimiter(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
    });

    it('compone antiabuso NAT y cuotas separadas por usuario sin doble cobro', async () => {
        const counters = new Map<string, number>();
        (kv.eval as jest.Mock).mockImplementation(async (_script, keys: string[]) => {
            const count = (counters.get(keys[0]) || 0) + 1;
            counters.set(keys[0], count);
            return count;
        });

        const app = express();
        app.set('trust proxy', true);
        app.use(preAuthRateLimiter);
        app.use((incoming, outgoing, nextMiddleware) => {
            const userId = String(incoming.headers['x-test-user']);
            (incoming as Request & { userId: string }).userId = userId;
            outgoing.locals.apiUser = { userId, role: 'default' };
            outgoing.locals.isApiKeyRequest = true;
            nextMiddleware();
        });
        app.get('/api/test', globalRateLimiter, (_incoming, outgoing) => outgoing.sendStatus(204));

        await request(app).get('/api/test').set('X-Forwarded-For', '203.0.113.8').set('X-Test-User', 'user-a').expect(204);
        await request(app).get('/api/test').set('X-Forwarded-For', '203.0.113.8').set('X-Test-User', 'user-b').expect(204);

        const keys = [...counters.keys()];
        expect(keys.filter((key) => key.includes('rl:preauth:203.0.113.8'))).toHaveLength(1);
        expect(keys.some((key) => key.includes('rl:api:user-a'))).toBe(true);
        expect(keys.some((key) => key.includes('rl:api:user-b'))).toBe(true);
        expect([...counters.values()].reduce((sum, count) => sum + count, 0)).toBe(4);
    });
});
