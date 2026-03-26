import { apiKeyValidator } from '../../src/core/middleware/apiKeyValidator';
import { Request, Response } from 'express';
import * as authService from '../../src/features/auth/auth.service';
import * as dbService from '../../src/core/database/dbService';

// Mock de servicios
jest.mock('../../src/core/database/dbService', () => ({
    getUser: jest.fn(),
    addSystemLog: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../src/features/auth/auth.service');

describe('API Key Validator Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            query: {},
            headers: {},
            path: '/api/test',
            originalUrl: '/api/test'
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            locals: {}
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
        // Reset implementations to prevent leakage
        (authService.getValidToken as jest.Mock).mockReset();
        (dbService.getUser as jest.Mock).mockReset();
    });

    it('should call next() for a public route without API key', async () => {
        (mockRequest as unknown as { path: string }).path = '/health';
        (mockRequest as unknown as { originalUrl: string }).originalUrl = '/health';
        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeUndefined();
    });

    it('should return 401 for a private route without API key', async () => {
        (mockRequest as unknown as { path: string }).path = '/api/data';
        (mockRequest as unknown as { originalUrl: string }).originalUrl = '/api/data';
        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() and populate user if valid API key is provided', async () => {
        const validKey = '11111111-1111-4111-8111-111111111111';
        mockRequest.query = { apiKey: validKey };

        // Mock success flow
        (authService.getValidToken as jest.Mock).mockResolvedValue({
            accessToken: 'token',
            userId: 'user123'
        });
        (dbService.getUser as jest.Mock).mockResolvedValue({
            userId: 'user123',
            isActive: true
        });

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeDefined();
        expect(mockResponse.locals?.apiUser.userId).toBe('user123');
    });

    it('should return 401 if API key is invalid', async () => {
        mockRequest.query = { apiKey: '44444444-4444-4444-8444-444444444444' }; // Formato UUID válido pero inexistente

        // Mock failure flow
        (authService.getValidToken as jest.Mock).mockRejectedValue(new Error('API Key inválida'));

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
    });
});
