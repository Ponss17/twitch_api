import { Response } from 'express';

jest.mock('../../src/core/database/dbService', () => ({
    getUser: jest.fn(),
    saveUser: jest.fn(),
    getUserByApiKey: jest.fn(),
    addAuditLog: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/features/auth/auth.service', () => ({
    getValidToken: jest.fn(),
    regenerateApiKey: jest.fn()
}));

jest.mock('../../src/features/twitch/twitch.service', () => ({
    getUserInfo: jest.fn(),
    validateToken: jest.fn()
}));

jest.mock('@vercel/kv', () => ({
    kv: {
        ping: jest.fn().mockResolvedValue('PONG')
    }
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '../../src/core/database/dbService';
import * as authService from '../../src/features/auth/auth.service';
import * as apiService from '../../src/features/twitch/twitch.service';
import {
    validateToken,
    regenerateKey,
    submitFeedback,
    getHealth
} from '../../src/features/system/system.controller';
import { AuthenticatedRequest } from '@/types/twitch';

const mockReq = (overrides = {}) =>
    ({
        userId: '123',
        displayName: 'TestUser',
        twitchToken: 'test_token',
        query: {},
        body: {},
        headers: {},
        ...overrides
    }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

describe('systemController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('validateToken', () => {
        it('should return valid=true for authenticated user with valid token', async () => {
            const req = mockReq();
            const res = mockRes();

            (apiService.validateToken as jest.Mock).mockResolvedValue({ login: 'testuser' });
            (apiService.getUserInfo as jest.Mock).mockResolvedValue({
                id: '123',
                login: 'testuser',
                display_name: 'TestUser',
                profile_image_url: 'http://img.url'
            });
            (dbService.getUser as jest.Mock).mockResolvedValue({
                userId: '123',
                apiKey: 'key-123'
            });

            await validateToken(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    valid: true,
                    user: expect.objectContaining({
                        id: '123',
                        login: 'testuser'
                    })
                })
            );
        });

        it('should return 401 if no token', async () => {
            const req = mockReq({ twitchToken: undefined });
            const res = mockRes();

            await validateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if token validation fails', async () => {
            const req = mockReq();
            const res = mockRes();

            (apiService.validateToken as jest.Mock).mockResolvedValue(null);

            await validateToken(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('regenerateKey', () => {
        it('should regenerate API key for authenticated user session', async () => {
            const req = mockReq({ userId: '123' });
            const res = mockRes();

            (authService.regenerateApiKey as jest.Mock).mockResolvedValue('new-api-key-uuid');

            await regenerateKey(req, res);

            expect(authService.regenerateApiKey).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    apiKey: 'new-api-key-uuid'
                })
            );
        });

        it('should return 401 if userId is missing from session', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await regenerateKey(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 500 if regeneration service fails', async () => {
            const req = mockReq();
            const res = mockRes();

            (authService.regenerateApiKey as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await regenerateKey(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('submitFeedback', () => {
        it('should return 200 on success', async () => {
            const req = mockReq({ body: { message: 'Test message' } });
            const res = mockRes();

            await submitFeedback(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getHealth', () => {
        it('should return health status with checks', async () => {
            const req = mockReq();
            const res = mockRes();

            (apiService.validateToken as jest.Mock).mockResolvedValue({ login: 'test' });

            await getHealth(req, res);

            expect(res.status).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: expect.any(String),
                    checks: expect.objectContaining({
                        redis: expect.objectContaining({ status: expect.any(String) }),
                        twitch: expect.objectContaining({ status: expect.any(String) })
                    }),
                    uptime: expect.any(String)
                })
            );
        });
    });
});
