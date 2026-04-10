import { Response } from 'express';

jest.mock('../../src/core/database/dbService', () => ({
    getUserStats: jest.fn(),
    getUserActivity: jest.fn(),
    recordUserRequest: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('@vercel/kv');

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

jest.mock('../../src/features/twitch/twitch.service', () => ({
    getClips: jest.fn(),
    getChatters: jest.fn(),
    getUserInfo: jest.fn(),
    validateToken: jest.fn()
}));

import * as dbService from '../../src/core/database/dbService';
import { getAnalytics, getLogs } from '../../src/features/dashboard/dashboard.controller';
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
                expect.objectContaining({ error: expect.any(String) })
            );
        });

        it('should return zeroed data if no userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await getAnalytics(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalRequests: 0,
                    averageLatency: '0ms (0.0s)',
                    successRate: '0%'
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
                {
                    type: 'followage',
                    user: 'OtherUser',
                    detail: 'channel1',
                    timestamp: '2026-01-02'
                }
            ];

            (dbService.getUserActivity as jest.Mock).mockResolvedValue(mockLogs);

            await getLogs(req, res);

            expect(dbService.getUserActivity).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith([
                {
                    ...mockLogs[0],
                    action: '📺 Nuevo clip creado por @TestUser (undefined)'
                },
                {
                    ...mockLogs[1],
                    action: '⏱️ @OtherUser revisó su followage en channel1'
                }
            ]);
        });

        it('should return empty array if no userId', async () => {
            const req = mockReq({ userId: undefined });
            const res = mockRes();

            await getLogs(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });
});
