const mockValidateToken = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateLastActive = jest.fn().mockResolvedValue(undefined);
const mockCacheGet = jest.fn();
const mockGetValidTokenForUser = jest.fn(
    async (user: { accessToken?: string; userId: string }) => ({
        accessToken: user.accessToken || 'tok',
        userId: user.userId
    })
);

jest.mock('../../backend/src/features/twitch/twitch.service', () => ({
    validateToken: mockValidateToken
}));

jest.mock('../../backend/src/core/database/dbService', () => ({
    getUser: mockGetUser,
    updateLastActive: mockUpdateLastActive
}));

jest.mock('../../backend/src/features/auth/auth.service', () => ({
    getValidTokenForUser: (...args: unknown[]) => mockGetValidTokenForUser(...args)
}));

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: jest.fn(),
    del: jest.fn()
}));

jest.mock('@/core/database/redisClient');

jest.mock('../../backend/src/core/middleware/redisRateLimiter', () => ({
    blockIfUnauthorizedScanExceeded: jest.fn().mockResolvedValue(false)
}));

jest.mock('@/core/utils/routeHelpers', () => ({
    isPublicRoute: jest.fn().mockReturnValue(false),
    isBotCommand: jest.fn().mockReturnValue(false),
    isApiRoute: jest.fn((path: string) => path.startsWith('/api') || path.startsWith('/twitch')),
    isJsonApiRoute: jest.fn((path: string) => path.includes('/dashboard/') || path.includes('/api/')),
    isOAuthCallbackRoute: jest.fn().mockReturnValue(false)
}));

import checkToken from '../../backend/src/core/middleware/authMiddleware';
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '../../backend/src/core/utils/sessionCookie';
import { mockRes, mockReq } from '../helpers/mockExpress';

describe('authMiddleware — cookie session', () => {
    let next: jest.Mock;

    beforeEach(() => {
        next = jest.fn();
        jest.clearAllMocks();
        mockCacheGet.mockResolvedValue(null);
    });

    it('autentica solo con cookie lp_sess válida', async () => {
        const cookieValue = createSessionCookieValue('cookie-user');
        const res = mockRes();
        res.cookie = jest.fn().mockReturnThis();
        res.clearCookie = jest.fn().mockReturnThis();
        const req = mockReq({
            path: '/api/dashboard/summary/',
            originalUrl: '/api/dashboard/summary/',
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}` }
        });

        mockGetUser.mockResolvedValue({
            userId: 'cookie-user',
            login: 'ponss',
            displayName: 'Ponss',
            accessToken: 'fresh-tok',
            isActive: true,
            timezone: 'UTC'
        });

        await checkToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.locals.isCookieSession).toBe(true);
        expect(res.locals.authSource).toBe('cookie');
        expect(req.userId).toBe('cookie-user');
        expect(mockValidateToken).not.toHaveBeenCalled();
    });

    it('responde 401 sin cookie ni header', async () => {
        const res = mockRes();
        const req = mockReq({ path: '/api/dashboard/summary/', originalUrl: '/api/dashboard/summary/' });

        await checkToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('no borra cookie y responde 503 en error transient de DB', async () => {
        const cookieValue = createSessionCookieValue('cookie-user');
        const clearCookie = jest.fn().mockReturnThis();
        const res = mockRes();
        res.clearCookie = clearCookie;
        const req = mockReq({
            path: '/api/dashboard/summary/',
            originalUrl: '/api/dashboard/summary/',
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}` }
        });

        mockGetUser.mockRejectedValue(new Error('fetch failed'));

        await checkToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(clearCookie).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });
});
