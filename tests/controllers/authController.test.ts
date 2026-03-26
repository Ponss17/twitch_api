import { Request, Response } from 'express';

jest.mock('../../src/features/auth/auth.service', () => ({
    getAuthorizeUrl: jest.fn(),
    handleCallback: jest.fn()
}));

jest.mock('../../src/core/database/dbService', () => ({
    isAdmin: jest.fn()
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import * as authService from '../../src/features/auth/auth.service';
import * as dbService from '../../src/core/database/dbService';
import { login, callback } from '../../src/features/auth/auth.controller';

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

        it('should pass isAdmin flag when admin=true', () => {
            const req = mockReq({ query: { admin: 'true' } });
            const res = mockRes();

            (authService.getAuthorizeUrl as jest.Mock).mockReturnValue('https://twitch.tv/auth');

            login(req, res);

            expect(authService.getAuthorizeUrl).toHaveBeenCalledWith('', { isAdmin: true });
        });
    });

    describe('callback', () => {
        it('should redirect to error if no code', async () => {
            const req = mockReq({ query: { state: 'test' } });
            const res = mockRes();

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/?error=no_code');
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
                expect.stringContaining('/api/twitch/dashboard')
            );
        });

        it('should redirect to error on auth failure', async () => {
            const req = mockReq({ query: { code: 'bad', state: '' } });
            const res = mockRes();

            (authService.handleCallback as jest.Mock).mockRejectedValue(new Error('Invalid code'));

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/?error=auth_failed');
        });

        it('should deny non-admin users on admin login flow', async () => {
            const state = Buffer.from(JSON.stringify({ isAdmin: true })).toString('base64');
            const req = mockReq({ query: { code: 'abc', state } });
            const res = mockRes();

            (authService.handleCallback as jest.Mock).mockResolvedValue({
                user: { id: '999', login: 'testuser', display_name: 'TestUser' },
                redirectOrigin: '',
                apiKey: 'key_abc'
            });
            (dbService.isAdmin as jest.Mock).mockResolvedValue(false);

            await callback(req, res);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('error=not_authorized')
            );
        });
    });
});
