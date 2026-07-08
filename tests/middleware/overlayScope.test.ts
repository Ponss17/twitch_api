import { Request, Response, NextFunction } from 'express';

jest.mock('../../backend/src/core/utils/jsonResponse', () => ({
    jsonError: jest.fn((_res: Response, status: number, message: string, opts?: { code?: string }) => {
        const res = _res as Response;
        res.status(status);
        res.json({ success: false, error: { message, code: opts?.code } });
        return res;
    })
}));

import { overlayScopeGuard } from '../../backend/src/core/middleware/overlayScope';
import { jsonError } from '../../backend/src/core/utils/jsonResponse';

const mockReq = (method: string, path: string) =>
    ({
        method,
        path,
        originalUrl: path
    }) as Request;

const mockRes = (locals: Record<string, unknown> = {}) => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.locals = locals;
    return res;
};

describe('overlayScopeGuard', () => {
    beforeEach(() => jest.clearAllMocks());

    it('allows non-overlay requests through', () => {
        const req = mockReq('GET', '/api/dashboard/summary');
        const res = mockRes();
        const next = jest.fn() as NextFunction;

        overlayScopeGuard(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(jsonError).not.toHaveBeenCalled();
    });

    it('allows overlay GET on overlay-state route', () => {
        const req = mockReq('GET', '/api/dashboard/overlay-state/roulette');
        const res = mockRes({ isOverlayReadRequest: true, overlayTool: 'roulette' });
        const next = jest.fn() as NextFunction;

        overlayScopeGuard(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('blocks overlay from dashboard summary', () => {
        const req = mockReq('GET', '/api/dashboard/summary');
        const res = mockRes({ isOverlayReadRequest: true });
        const next = jest.fn() as NextFunction;

        overlayScopeGuard(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(jsonError).toHaveBeenCalledWith(
            res,
            403,
            expect.stringContaining('overlay'),
            expect.objectContaining({ code: 'OVERLAY_READ_ONLY' })
        );
    });

    it('blocks overlay from system validate', () => {
        const req = mockReq('GET', '/api/system/validate');
        const res = mockRes({ isOverlayReadRequest: true });
        const next = jest.fn() as NextFunction;

        overlayScopeGuard(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(jsonError).toHaveBeenCalledWith(
            res,
            403,
            expect.stringContaining('sistema'),
            expect.objectContaining({ code: 'OVERLAY_READ_ONLY' })
        );
    });
});
