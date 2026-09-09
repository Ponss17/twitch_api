import { Response } from 'express';

jest.mock('@/features/dashboard/monthlyReports.service', () => ({
    ensurePreviousMonthlyReport: jest.fn(),
    listMonthlyReports: jest.fn(),
    getMonthlyReport: jest.fn(),
    listUserNotifications: jest.fn(),
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn()
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as monthlyReports from '@/features/dashboard/monthlyReports.service';
import * as controller from '@/features/dashboard/monthlyReports.controller';
import type { AuthenticatedRequest } from '@/types/twitch';

function mockRes() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
    };
    return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
}

describe('monthlyReports.controller security', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('ensure sin userId → 401', async () => {
        const req = { userId: undefined } as AuthenticatedRequest;
        const res = mockRes();
        await controller.ensureMonthlyReport(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(monthlyReports.ensurePreviousMonthlyReport).not.toHaveBeenCalled();
    });

    it('get reporte ajeno/inexistente → 404 (no filtra data)', async () => {
        (monthlyReports.getMonthlyReport as jest.Mock).mockResolvedValue(null);
        const req = {
            userId: 'user-a',
            params: { yearMonth: '2026-08' }
        } as unknown as AuthenticatedRequest;
        const res = mockRes();
        await controller.getMonthlyReport(req, res);
        expect(monthlyReports.getMonthlyReport).toHaveBeenCalledWith('user-a', '2026-08');
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('mark read ajena → 404', async () => {
        (monthlyReports.markNotificationRead as jest.Mock).mockResolvedValue(false);
        const req = {
            userId: 'user-a',
            params: { id: '11111111-1111-1111-1111-111111111111' }
        } as unknown as AuthenticatedRequest;
        const res = mockRes();
        await controller.markNotificationRead(req, res);
        expect(monthlyReports.markNotificationRead).toHaveBeenCalledWith(
            'user-a',
            '11111111-1111-1111-1111-111111111111'
        );
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
