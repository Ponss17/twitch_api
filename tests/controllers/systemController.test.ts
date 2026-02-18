import { Response } from 'express';

jest.mock('@/services/infrastructure/dbService', () => ({
    getUser: jest.fn(),
    saveUser: jest.fn(),
    getUserByApiKey: jest.fn()
}));

jest.mock('@/services/auth/authService', () => ({
    getValidToken: jest.fn(),
    regenerateApiKey: jest.fn()
}));

jest.mock('@/services/twitch/apiService', () => ({
    getUserInfo: jest.fn(),
    validateToken: jest.fn()
}));

jest.mock('axios');

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '@/services/infrastructure/dbService';
import * as authService from '@/services/auth/authService';
import * as apiService from '@/services/twitch/apiService';
import {
    validateToken,
    regenerateKey,
    submitFeedback,
    getHealth
} from '@/controllers/system/systemController';
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
                    token: 'test_token'
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
        it('should regenerate API key for valid existing key', async () => {
            const req = mockReq({ body: { key: 'old-api-key' } });
            const res = mockRes();

            (dbService.getUserByApiKey as jest.Mock).mockResolvedValue({ userId: '123' });
            (authService.regenerateApiKey as jest.Mock).mockResolvedValue('new-api-key-uuid');

            await regenerateKey(req, res);

            expect(authService.regenerateApiKey).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    apiKey: 'new-api-key-uuid'
                })
            );
        });

        it('should return 400 if no key provided in body', async () => {
            const req = mockReq({ body: {} });
            const res = mockRes();

            await regenerateKey(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 401 if API key not found in DB', async () => {
            const req = mockReq({ body: { key: 'invalid-key' } });
            const res = mockRes();

            (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(null);

            await regenerateKey(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('submitFeedback', () => {
        it('should return 400 if no message provided', async () => {
            const req = mockReq({ body: {} });
            const res = mockRes();

            await submitFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getHealth', () => {
        it('should return health status with checks', async () => {
            const req = mockReq();
            const res = mockRes();

            (dbService.getUser as jest.Mock).mockResolvedValue(null);
            (apiService.validateToken as jest.Mock).mockResolvedValue({ login: 'test' });

            await getHealth(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: expect.any(String),
                    checks: expect.objectContaining({
                        database: expect.any(String),
                        twitch: expect.any(String)
                    }),
                    latency: expect.any(String)
                })
            );
        });
    });
});
