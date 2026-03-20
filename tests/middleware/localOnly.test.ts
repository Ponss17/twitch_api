/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { localOnly } from '../../src/core/middleware/localOnly';

describe('LocalOnly Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction = jest.fn();

    beforeEach(() => {
        mockRequest = {
            ip: '127.0.0.1',
            socket: {} as any
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        nextFunction = jest.fn();
    });

    it('should allow access for IPv4 localhost (127.0.0.1)', () => {
        (mockRequest as unknown as Record<string, unknown>).ip = '127.0.0.1';
        localOnly(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow access for IPv6 localhost (::1)', () => {
        (mockRequest as any).ip = '::1';
        localOnly(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow access for mapped IPv4 localhost (::ffff:127.0.0.1)', () => {
        (mockRequest as any).ip = '::ffff:127.0.0.1';
        localOnly(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should block access for external IP (e.g., 192.168.1.1)', () => {
        (mockRequest as any).ip = '192.168.1.1';
        localOnly(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith('Not Found');
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block access for public IP (e.g., 8.8.8.8)', () => {
        (mockRequest as any).ip = '8.8.8.8';
        localOnly(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(nextFunction).not.toHaveBeenCalled();
    });
});
