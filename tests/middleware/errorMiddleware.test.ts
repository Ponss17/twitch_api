import { Request, Response, NextFunction } from 'express';

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import { errorHandler, requestLogger } from '@/middleware/errorMiddleware';

const mockReq = (overrides = {}) =>
    ({
        path: '/api/test',
        method: 'GET',
        originalUrl: '/api/test',
        accepts: jest.fn().mockReturnValue(false),
        ...overrides
    }) as unknown as Request;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendFile = jest.fn().mockReturnValue(res);
    res.statusCode = 200;
    res.on = jest.fn().mockImplementation((event, cb) => {
        if (event === 'finish') cb();
        return res;
    });
    return res;
};

const mockNext: NextFunction = jest.fn();

describe('errorMiddleware', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('errorHandler', () => {
        it('should send plain text for API routes', () => {
            const req = mockReq({ path: '/api/test' });
            const res = mockRes();

            errorHandler({ status: 400, message: 'Bad request' }, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Bad request');
        });

        it('should send plain text for /twitch routes', () => {
            const req = mockReq({ path: '/twitch/clips' });
            const res = mockRes();

            errorHandler({ message: 'Server error' }, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Server error');
        });

        it('should return JSON for non-API routes that do not accept HTML', () => {
            const req = mockReq({ path: '/dashboard', accepts: jest.fn().mockReturnValue(false) });
            const res = mockRes();

            errorHandler({ status: 403, message: 'Forbidden' }, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ code: 403, message: 'Forbidden' })
                })
            );
        });

        it('should default to status 500 and generic message', () => {
            const req = mockReq({ path: '/api/x' });
            const res = mockRes();

            errorHandler({}, req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Error interno del servidor');
        });
    });

    describe('requestLogger', () => {
        it('should call next and register finish listener', () => {
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            requestLogger(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
        });
    });
});
