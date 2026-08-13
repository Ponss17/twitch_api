const mockValidateToken = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateLastActive = jest.fn().mockResolvedValue(undefined);
const mockCacheGet = jest.fn();
const mockSensitiveGet = jest.fn();
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

jest.mock('../../backend/src/features/auth/auth.service', () => {
    const actual = jest.requireActual('../../backend/src/features/auth/auth.service') as Record<
        string,
        unknown
    >;
    return {
        ...actual,
        getValidTokenForUser: (...args: unknown[]) => mockGetValidTokenForUser(...args)
    };
});

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: (...args: unknown[]) => mockCacheGet(...args),
    getSensitive: (...args: unknown[]) => mockSensitiveGet(...args),
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
        mockSensitiveGet.mockResolvedValue({ status: 'ok', value: 'session-nonce' });
    });

    it('autentica solo con cookie lp_sess válida', async () => {
        const cookieValue = createSessionCookieValue('cookie-user', 'session-nonce');
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
        const cookieValue = createSessionCookieValue('cookie-user', 'session-nonce');
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

    it('rechaza una cookie anterior al logout aunque siga criptográficamente válida', async () => {
        const cookieValue = createSessionCookieValue('cookie-user', 'old-nonce');
        const res = mockRes();
        res.clearCookie = jest.fn().mockReturnThis();
        const req = mockReq({
            path: '/api/dashboard/summary/',
            originalUrl: '/api/dashboard/summary/',
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}` }
        });
        mockSensitiveGet.mockResolvedValue({ status: 'ok', value: 'revoked-nonce' });

        await checkToken(req, res, next);

        expect(res.clearCookie).toHaveBeenCalled();
        expect(mockGetUser).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('acepta un login nuevo sin reactivar la cookie anterior', async () => {
        const freshCookie = createSessionCookieValue('cookie-user', 'new-nonce');
        const res = mockRes();
        const req = mockReq({
            path: '/api/dashboard/summary/',
            originalUrl: '/api/dashboard/summary/',
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(freshCookie)}` }
        });
        mockSensitiveGet.mockResolvedValue({ status: 'ok', value: 'new-nonce' });
        mockGetUser.mockResolvedValue({
            userId: 'cookie-user',
            login: 'ponss',
            displayName: 'Ponss',
            accessToken: 'fresh-tok',
            isActive: true
        });

        await checkToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe('cookie-user');
    });

    it('mantiene la cookie del panel si falla el refresh OAuth de Twitch', async () => {
        const { AppError } = await import('../../backend/src/core/errors/AppError');
        const cookieValue = createSessionCookieValue('cookie-user', 'session-nonce');
        const clearCookie = jest.fn().mockReturnThis();
        const res = mockRes();
        res.clearCookie = clearCookie;
        const req = mockReq({
            path: '/api/dashboard/summary/',
            originalUrl: '/api/dashboard/summary/',
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}` }
        });

        mockGetUser.mockResolvedValue({
            userId: 'cookie-user',
            login: 'ponss',
            displayName: 'Ponss',
            accessToken: 'stale-tok',
            tokenExpiresAt: Date.now() - 60_000,
            isActive: true,
            timezone: 'UTC'
        });
        mockGetValidTokenForUser.mockRejectedValueOnce(
            new AppError('Sesión expirada. Por favor, vuelve a autenticarte o pide ayuda a Ponss 🦆', 401)
        );

        await checkToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(clearCookie).not.toHaveBeenCalled();
        expect(res.locals.isCookieSession).toBe(true);
        expect(req.userId).toBe('cookie-user');
        // Seguro: no adjuntar access token Twitch ya vencido (Helix fallará en el endpoint).
        expect(req.twitchToken).toBeUndefined();
    });
});
