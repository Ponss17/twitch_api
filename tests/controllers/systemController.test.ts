import { Response } from 'express';
import axios from 'axios';

jest.mock('axios');

jest.mock('../../backend/src/core/database/dbService', () => ({
    getUser: jest.fn(),
    saveUser: jest.fn(),
    getUserByApiKey: jest.fn(),
    getUserByLogin: jest.fn(),
    addAuditLog: jest.fn().mockResolvedValue(undefined),
    recordUserRequest: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/features/auth/auth.service', () => ({
    getValidToken: jest.fn(),
    regenerateApiKey: jest.fn()
}));

jest.mock('../../backend/src/features/twitch/twitch.service', () => ({
    getUserInfo: jest.fn(),
    validateToken: jest.fn()
}));

jest.mock('@/core/database/redisClient', () => ({
    kv: {
        ping: jest.fn().mockResolvedValue('PONG'),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK')
    }
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

jest.mock('../../backend/src/core/utils/cacheInvalidation', () => ({
    invalidateAllUserCaches: jest.fn().mockResolvedValue(undefined)
}));

import * as dbService from '../../backend/src/core/database/dbService';
import * as authService from '../../backend/src/features/auth/auth.service';
import { invalidateAllUserCaches } from '../../backend/src/core/utils/cacheInvalidation';
import * as apiService from '../../backend/src/features/twitch/twitch.service';
import {
    validateToken,
    regenerateKey,
    submitFeedback,
    getHealth
} from '../../backend/src/features/system/system.controller';
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
    const res = { locals: {} } as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.append = jest.fn().mockReturnValue(res);
    return res;
};

describe('systemController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('validateToken', () => {
        it('should return valid=true for authenticated user with valid token', async () => {
            const req = mockReq();
            const res = mockRes();

            (apiService.validateToken as jest.Mock).mockResolvedValue({
                login: 'testuser',
                user_id: '123'
            });
            (dbService.getUserByLogin as jest.Mock).mockResolvedValue({
                userId: '123',
                apiKey: 'key-123'
            });
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

            const payload = (res.json as jest.Mock).mock.calls[0][0];
            expect(payload.valid).toBe(true);
            expect(payload.apiKey).toBeUndefined();
            expect(payload.user).toEqual(
                expect.objectContaining({
                    id: '123',
                    login: 'testuser'
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
            expect(invalidateAllUserCaches).toHaveBeenCalledWith('123', {
                apiKey: undefined,
                login: undefined,
                revokeApiKey: true
            });
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

            (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

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
                    services: expect.objectContaining({
                        cache: expect.objectContaining({ status: expect.any(String) }),
                        twitch: expect.objectContaining({ status: expect.any(String) })
                    }),
                    uptime: expect.any(String)
                })
            );
        });
    });
});
