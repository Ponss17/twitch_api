import { Request, Response } from 'express';

jest.mock('../../backend/src/features/auth/auth.service', () => ({
    getAuthorizeUrl: jest.fn(),
    createOAuthState: jest.fn().mockReturnValue('signed-browser-state'),
    consumeOAuthState: jest.fn().mockResolvedValue('ok'),
    handleCallback: jest.fn(),
    signAuthExchange: jest.fn().mockReturnValue('signed-auth-token'),
    verifyState: jest.fn(),
    verifyAuthExchange: jest.fn(),
    consumeAuthExchangeToken: jest.fn().mockResolvedValue('ok')
}));

jest.mock('../../backend/src/core/utils/oauthStateCookie', () => ({
    setOAuthStateCookie: jest.fn(),
    clearOAuthStateCookie: jest.fn(),
    readOAuthStateCookie: jest.fn().mockReturnValue('signed-browser-state')
}));

jest.mock('../../backend/src/core/utils/sessionState', () => ({
    establishSession: jest.fn().mockResolvedValue(undefined),
    revokeSessions: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/core/database/dbService', () => ({
    isAdmin: jest.fn(),
    recordUserRequest: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/core/database/auditService', () => ({
    addAuditLog: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as authService from '../../backend/src/features/auth/auth.service';
import * as auditService from '../../backend/src/core/database/auditService';
import { login, callback, exchange, logout } from '../../backend/src/features/auth/auth.controller';
import {
    readOAuthStateCookie,
    setOAuthStateCookie
} from '../../backend/src/core/utils/oauthStateCookie';

const mockReq = (overrides = {}) =>
    ({
        query: {},
        ...overrides
    }) as unknown as Request;

const mockRes = () => {
    const res = {} as Response;
    res.redirect = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.append = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
};

describe('authController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('login', () => {
        it('should redirect to Twitch authorize URL', () => {
            const req = mockReq({ query: {} });
            const res = mockRes();

            (authService.getAuthorizeUrl as jest.Mock).mockReturnValue(
                'https://id.twitch.tv/oauth2/authorize?test=1'
            );

            login(req, res);

            expect(authService.getAuthorizeUrl).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(
                'https://id.twitch.tv/oauth2/authorize?test=1'
            );
        });

        it('should pass redirect_origin to service', () => {
            const req = mockReq({ query: { redirect_origin: 'https://losperris.dev' } });
            const res = mockRes();

            (authService.getAuthorizeUrl as jest.Mock).mockReturnValue('https://twitch.tv/auth');

            login(req, res);

            expect(authService.getAuthorizeUrl).toHaveBeenCalledWith(
                'https://losperris.dev',
                undefined,
                'signed-browser-state'
            );
            expect(setOAuthStateCookie).toHaveBeenCalledWith(res, 'signed-browser-state');
        });
    });

    describe('callback', () => {
        it('should redirect to error if no code', async () => {
            const req = mockReq({ query: { state: 'test' } });
            const res = mockRes();

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringMatching(/\?error=no_code$/)
            );
        });

        it('should redirect to dashboard on successful auth', async () => {
            const req = mockReq({ query: { code: 'abc123', state: 'signed-browser-state' } });
            const res = mockRes();

            (authService.verifyState as jest.Mock).mockReturnValue({});
            (authService.handleCallback as jest.Mock).mockResolvedValue({
                user: { id: '999', login: 'testuser', display_name: 'TestUser' },
                redirectOrigin: '',
                apiKey: 'key_abc'
            });

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringMatching(/\/dashboard\/\?auth=/)
            );
        });

        it('should redirect to error on auth failure', async () => {
            const req = mockReq({ query: { code: 'bad', state: 'signed-browser-state' } });
            const res = mockRes();

            (authService.verifyState as jest.Mock).mockReturnValue({});
            (authService.handleCallback as jest.Mock).mockRejectedValue(new Error('Invalid code'));

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringMatching(/\?error=auth_failed$/)
            );
        });

        it('should redirect to dashboard for normal user flow', async () => {
            const req = mockReq({ query: { code: 'abc', state: 'signed-browser-state' } });
            const res = mockRes();

            (authService.verifyState as jest.Mock).mockReturnValue({});
            (authService.handleCallback as jest.Mock).mockResolvedValue({
                user: { id: '999', login: 'testuser', display_name: 'TestUser' },
                redirectOrigin: '',
                apiKey: 'key_abc'
            });

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringMatching(/\/dashboard\/\?auth=/)
            );
        });

        it('rejects callback without state before token exchange', async () => {
            const req = mockReq({ query: { code: 'abc' } });
            const res = mockRes();

            await callback(req, res);

            expect(authService.handleCallback).not.toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(expect.stringMatching(/invalid_state$/));
        });

        it('rejects callback when browser cookie does not match state', async () => {
            const req = mockReq({ query: { code: 'abc', state: 'signed-browser-state' } });
            const res = mockRes();
            (authService.verifyState as jest.Mock).mockReturnValue({});
            (readOAuthStateCookie as jest.Mock).mockReturnValueOnce('different-state');

            await callback(req, res);

            expect(authService.consumeOAuthState).not.toHaveBeenCalled();
            expect(authService.handleCallback).not.toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(expect.stringMatching(/invalid_state$/));
        });

        it('rejects replayed state before token exchange', async () => {
            const req = mockReq({ query: { code: 'abc', state: 'signed-browser-state' } });
            const res = mockRes();
            (authService.verifyState as jest.Mock).mockReturnValue({});
            (authService.consumeOAuthState as jest.Mock).mockResolvedValueOnce('replay');

            await callback(req, res);

            expect(authService.handleCallback).not.toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith(expect.stringMatching(/state_replayed$/));
        });
    });

    describe('exchange', () => {
        it('should return 400 if auth param is missing', async () => {
            const req = mockReq({ query: {} });
            const res = mockRes();

            await exchange(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({
                    message: expect.any(String),
                    code: 'MISSING_AUTH'
                })
            });
        });

        it('should return 401 if auth token is invalid or expired', async () => {
            const req = mockReq({ query: { auth: 'bad-token' } });
            const res = mockRes();

            (authService.verifyAuthExchange as jest.Mock).mockReturnValue(null);

            await exchange(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({
                    message: expect.any(String),
                    code: 'INVALID_AUTH'
                })
            });
        });

        it('should return 401 if auth token was already consumed', async () => {
            const req = mockReq({ query: { auth: 'used-token' } });
            const res = mockRes();

            (authService.verifyAuthExchange as jest.Mock).mockReturnValue({
                apiKey: 'key_abc',
                userId: '999',
                login: 'testuser',
                displayName: 'TestUser'
            });
            (authService.consumeAuthExchangeToken as jest.Mock).mockResolvedValue('replay');

            await exchange(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({ code: 'AUTH_ALREADY_USED' })
            });
        });

        it('should return session payload for valid auth token', async () => {
            const req = mockReq({ query: { auth: 'valid-token' } });
            const res = mockRes();

            (authService.verifyAuthExchange as jest.Mock).mockReturnValue({
                apiKey: 'key_abc',
                userId: '999',
                login: 'testuser',
                displayName: 'TestUser',
                profile_image_url: 'https://img.test/avatar.png'
            });
            (authService.consumeAuthExchangeToken as jest.Mock).mockResolvedValue('ok');

            await exchange(req, res);

            expect(res.json).toHaveBeenCalledWith({
                userId: '999',
                login: 'testuser',
                displayName: 'TestUser',
                profile_image_url: 'https://img.test/avatar.png'
            });
            expect(res.json).not.toHaveBeenCalledWith(
                expect.objectContaining({ apiKey: expect.anything() })
            );
            expect(auditService.addAuditLog).toHaveBeenCalledWith('session_login', '999', '999');
        });

        it('should return 503 if auth exchange store is unavailable', async () => {
            const req = mockReq({ query: { auth: 'valid-token' } });
            const res = mockRes();

            (authService.verifyAuthExchange as jest.Mock).mockReturnValue({
                apiKey: 'key_abc',
                userId: '999',
                login: 'testuser',
                displayName: 'TestUser'
            });
            (authService.consumeAuthExchangeToken as jest.Mock).mockResolvedValue('unavailable');

            await exchange(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: expect.objectContaining({ code: 'SERVICE_UNAVAILABLE' })
            });
        });
    });

    describe('logout', () => {
        it('revokes the session and writes a logout audit log', async () => {
            const req = mockReq({ userId: '999', login: 'testuser' });
            const res = mockRes();

            await logout(req as never, res);

            expect(auditService.addAuditLog).toHaveBeenCalledWith('session_logout', '999', '999');
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });
});
