import { describe, expect, it } from '@jest/globals';
import { requireDashboardAjax } from '../../backend/src/core/middleware/dashboardAjaxGuard';
import { mockReq, mockRes } from '../helpers/mockExpress';

describe('dashboardAjaxGuard', () => {
    it('rechaza peticiones sin X-Requested-With', () => {
        const req = mockReq({ headers: {} });
        const res = mockRes();
        const next = jest.fn();

        requireDashboardAjax(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'AJAX_REQUIRED' })
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('permite peticiones AJAX del panel', () => {
        const req = mockReq();
        req.get = jest.fn((name: string) =>
            name === 'X-Requested-With' ? 'XMLHttpRequest' : undefined
        ) as typeof req.get;
        const res = mockRes();
        const next = jest.fn();

        requireDashboardAjax(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
