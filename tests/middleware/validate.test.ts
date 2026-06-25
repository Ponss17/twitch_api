import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../backend/src/core/middleware/validate';

const mockReq = (overrides = {}) =>
    ({
        body: {},
        query: {},
        params: {},
        originalUrl: '/api/test',
        ...overrides
    }) as unknown as Request;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};

describe('validate middleware', () => {
    beforeEach(() => jest.clearAllMocks());

    const schema = z.object({
        query: z.object({
            channel: z.string().min(1)
        })
    });

    it('should call next() for valid input', async () => {
        const req = mockReq({ query: { channel: 'testchannel' } });
        const res = mockRes();
        const next: NextFunction = jest.fn();

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with Zod errors for invalid input', async () => {
        const req = mockReq({ query: {} });
        const res = mockRes();
        const next: NextFunction = jest.fn();

        const middleware = validate(schema);
        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Error de validación',
                    code: 'VALIDATION_ERROR',
                    details: expect.any(Array)
                })
            })
        );
    });

    it('should include path info in error details', async () => {
        const req = mockReq({ query: {} });
        const res = mockRes();
        const next: NextFunction = jest.fn();

        const middleware = validate(schema);
        await middleware(req, res, next);

        const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
        expect(jsonCall.error.details[0]).toHaveProperty('path');
        expect(jsonCall.error.details[0]).toHaveProperty('message');
    });
});
