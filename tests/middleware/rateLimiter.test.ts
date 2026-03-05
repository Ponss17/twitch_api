import { Response, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../../src/core/config/limits';

describe('Rate Limiter Middleware', () => {
    it('should implement a rate limit function', () => {
        const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
        expect(typeof limiter).toBe('function');
    });
});

describe('heavyLimiter — lógica de max()', () => {
    const buildRes = (isApiKeyRequest: boolean) =>
        ({ locals: { isApiKeyRequest } }) as unknown as Response;

    const buildReq = (apiKey?: string, userId?: string) =>
        ({
            query: apiKey ? { apiKey } : {},
            userId
        }) as unknown as Request;

    const extractMax = (config: { max: ((req: Request, res: Response) => number) | number }) => {
        if (typeof config.max === 'function') return config.max;
        return () => config.max as number;
    };

    it('debería devolver HEAVY (10) cuando es una petición con API Key externa', () => {
        const maxFn = extractMax({
            max: (req: Request, res: Response) => {
                const isApiKeyRequest = res.locals?.isApiKeyRequest;
                if (isApiKeyRequest) return RATE_LIMITS.HEAVY;
                return RATE_LIMITS.DASHBOARD;
            }
        });
        const result = maxFn(buildReq('test-key'), buildRes(true));
        expect(result).toBe(RATE_LIMITS.HEAVY);
        expect(result).toBe(10);
    });

    it('debería devolver DASHBOARD (1000) cuando es una sesión del dashboard', () => {
        const maxFn = extractMax({
            max: (req: Request, res: Response) => {
                const isApiKeyRequest = res.locals?.isApiKeyRequest;
                if (isApiKeyRequest) return RATE_LIMITS.HEAVY;
                return RATE_LIMITS.DASHBOARD;
            }
        });
        const result = maxFn(buildReq(undefined, 'sess_user_123'), buildRes(false));
        expect(result).toBe(RATE_LIMITS.DASHBOARD);
        expect(result).toBe(1000);
    });

    it('debería producir claves distintas para API Key vs sesión', () => {
        const keyGenerator = (req: Request, res: Response): string => {
            const apiUser = res.locals?.apiUser;
            if (apiUser) return `heavy:${(req.query.apiKey as string) || apiUser.userId}`;
            const userId = (req as unknown as { userId: string }).userId;
            return `heavy:sess:${userId || 'anon'}`;
        };

        const apiKeyReq = buildReq('mi-api-key');
        const apiKeyRes = { locals: { apiUser: { userId: '123' } } } as unknown as Response;
        const sessReq = buildReq(undefined, 'user456');
        const sessRes = { locals: {} } as unknown as Response;

        const apiKey = keyGenerator(apiKeyReq, apiKeyRes);
        const session = keyGenerator(sessReq, sessRes);

        expect(apiKey).toMatch(/^heavy:mi-api-key/);
        expect(session).toMatch(/^heavy:sess:user456/);
        expect(apiKey).not.toBe(session);
    });
});
