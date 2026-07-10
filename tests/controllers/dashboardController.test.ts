import { Response } from 'express';

jest.mock('../../backend/src/core/database/dbService', () => ({
    getUserStats: jest.fn(),
    getDailyStats: jest.fn().mockResolvedValue([]),
    getUserActivity: jest.fn(),
    clearUserStatsAndLogs: jest.fn(),
    deleteUser: jest.fn(),
    recordUserRequest: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/core/utils/cacheInvalidation', () => ({
    invalidateAllUserCaches: jest.fn().mockResolvedValue(undefined),
    invalidateDashboardStatsCaches: jest.fn().mockResolvedValue(undefined),
    invalidateOverlayStateCaches: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    getStatsRevision: jest.fn().mockResolvedValue(0),
    invalidateDashboardCache: jest.fn().mockResolvedValue(undefined),
    invalidateDashboardAnalytics: jest.fn().mockResolvedValue(undefined),
    bumpStatsRevision: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@/core/database/redisClient');

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

jest.mock('../../backend/src/features/twitch/twitch.service', () => ({
    getClips: jest.fn(),
    getChatters: jest.fn(),
    getUserInfo: jest.fn(),
    validateToken: jest.fn()
}));

import * as dbService from '../../backend/src/core/database/dbService';
import { invalidateAllUserCaches, invalidateDashboardStatsCaches } from '../../backend/src/core/utils/cacheInvalidation';
import { getAnalytics, getLogs, clearUserData, deleteAccount, exportCheck, recordExportComplete } from '../../backend/src/features/dashboard/dashboard.controller';
import { AuthenticatedRequest } from '@/types/twitch';

const mockReq = (overrides = {}) =>
    ({
        userId: '123',
        twitchToken: 'test_token',
        query: {},
        ...overrides
    }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.locals = { apiUser: {} };
    return res;
};

describe('dashboardController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getAnalytics', () => {
        it('should return analytics with calculated averages', async () => {
            const req = mockReq();
            const res = mockRes();

            const today = new Date().toISOString().split('T')[0];
            (dbService.getUserStats as jest.Mock).mockResolvedValue({
                total_requests: 100,
                total_latency: 5000,
                total_errors: 5,
                [`d:${today}`]: 10,
                [`l:${today}`]: 500,
                [`e:${today}`]: 1,
                today_req_raw: 10,
                today_lat_raw: 500,
                today_err_raw: 1
            });

            await getAnalytics(req, res);

            expect(dbService.getUserStats).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalRequests: 100,
                    todayRequests: 10
                })
            );
        });

        it('should handle missing stats gracefully', async () => {
            const req = mockReq();
            const res = mockRes();

            (dbService.getUserStats as jest.Mock).mockRejectedValue(new Error('DB error'));

            await getAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ message: expect.any(String) })
                })
            );
        });

        it('should return 401 if no userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await getAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ message: expect.any(String) })
                })
            );
        });
    });

    describe('getLogs', () => {
        it('should return activity logs array directly', async () => {
            const req = mockReq();
            const res = mockRes();
            const mockLogs = [
                { type: 'clip', user: 'TestUser', timestamp: '2026-01-01' },
                { type: 'followage', user: 'OtherUser', metadata: { target: 'channel1' }, timestamp: '2026-01-02' }
            ];

            (dbService.getUserActivity as jest.Mock).mockResolvedValue(mockLogs);

            await getLogs(req, res);

            expect(dbService.getUserActivity).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(mockLogs);
        });

        it('should return empty array if no userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await getLogs(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('clearUserData', () => {
        it('should clear stats and invalidate cache', async () => {
            const req = mockReq({ login: 'streamer' });
            const res = mockRes();

            (dbService.clearUserStatsAndLogs as jest.Mock).mockResolvedValue(undefined);

            await clearUserData(req, res);

            expect(dbService.clearUserStatsAndLogs).toHaveBeenCalledWith('123');
            expect(invalidateDashboardStatsCaches).toHaveBeenCalledWith('123', 'streamer');
            expect(invalidateAllUserCaches).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    analytics: expect.objectContaining({ todayRequests: 0, clips: 0 }),
                    activity: []
                })
            );
        });

        it('should return 401 without userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await clearUserData(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ message: expect.any(String) })
                })
            );
        });
    });

    describe('deleteAccount', () => {
        it('should delete user and invalidate cache', async () => {
            const req = mockReq({ login: 'streamer' });
            const res = mockRes();

            (dbService.deleteUser as jest.Mock).mockResolvedValue(undefined);

            await deleteAccount(req, res);

            expect(dbService.deleteUser).toHaveBeenCalledWith('123');
            expect(invalidateAllUserCaches).toHaveBeenCalledWith('123', {
                apiKey: undefined,
                login: 'streamer',
                revokeApiKey: true
            });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        it('should return 401 without userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await deleteAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('exportCheck', () => {
        it('returns success when no cooldown', async () => {
            const req = mockReq();
            const res = mockRes();

            await exportCheck(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('returns 429 when export cooldown active', async () => {
            const { get } = await import('../../backend/src/core/database/cacheService');
            (get as jest.Mock).mockResolvedValueOnce(Date.now() + 120_000);

            const req = mockReq();
            const res = mockRes();

            await exportCheck(req, res);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ code: 'RATE_LIMITED' })
                })
            );
        });

        it('returns 401 without userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await exportCheck(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('recordExportComplete', () => {
        it('sets export cooldown and returns success', async () => {
            const { set } = await import('../../backend/src/core/database/cacheService');
            const req = mockReq();
            const res = mockRes();

            await recordExportComplete(req, res);

            expect(set).toHaveBeenCalledWith(
                'export_cooldown:123',
                expect.any(Number),
                240
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('returns 401 without userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await recordExportComplete(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
