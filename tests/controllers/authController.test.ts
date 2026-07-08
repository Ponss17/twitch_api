import { Request, Response } from 'express';

jest.mock('../../backend/src/features/auth/auth.service', () => ({
    getAuthorizeUrl: jest.fn(),
    handleCallback: jest.fn(),
    signAuthExchange: jest.fn().mockReturnValue('signed-auth-token'),
    verifyState: jest.fn(),
    verifyAuthExchange: jest.fn(),
    consumeAuthExchangeToken: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../backend/src/core/database/dbService', () => ({
    isAdmin: jest.fn(),
    recordUserRequest: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as authService from '../../backend/src/features/auth/auth.service';
import { login, callback, exchange } from '../../backend/src/features/auth/auth.controller';

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
                undefined
            );
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
            const req = mockReq({ query: { code: 'abc123', state: '' } });
            const res = mockRes();

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
            const req = mockReq({ query: { code: 'bad', state: '' } });
            const res = mockRes();

            (authService.handleCallback as jest.Mock).mockRejectedValue(new Error('Invalid code'));

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringMatching(/\?error=auth_failed$/)
            );
        });

        it('should redirect to dashboard for normal user flow', async () => {
            const req = mockReq({ query: { code: 'abc', state: '' } });
            const res = mockRes();

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
            (authService.consumeAuthExchangeToken as jest.Mock).mockResolvedValue(false);

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
            (authService.consumeAuthExchangeToken as jest.Mock).mockResolvedValue(true);

            await exchange(req, res);

            expect(res.json).toHaveBeenCalledWith({
                apiKey: 'key_abc',
                userId: '999',
                login: 'testuser',
                displayName: 'TestUser',
                profile_image_url: 'https://img.test/avatar.png'
            });
        });
    });
});
