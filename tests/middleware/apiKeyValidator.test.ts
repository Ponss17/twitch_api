import { apiKeyValidator } from '@/middleware/apiKeyValidator';
import { Request, Response } from 'express';
import * as authService from '@/services/auth/authService';
import * as dbService from '@/services/infrastructure/dbService';

// Mock de servicios
jest.mock('@/services/infrastructure/dbService');
jest.mock('@/services/auth/authService');

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
            json: jest.fn(),
            locals: {}
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next() without user if no API key is provided', async () => {
        // El validador actual llama a next() si no hay key, permitiendo acceso público o manejo posterior
        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeUndefined();
    });

    it('should call next() and populate user if valid API key is provided', async () => {
        mockRequest.query = { apiKey: 'valid_key' };

        // Mock success flow
        (authService.getValidToken as jest.Mock).mockResolvedValue({
            accessToken: 'token',
            userId: '123'
        });
        (dbService.getUser as jest.Mock).mockResolvedValue({
            userId: '123',
            isActive: true
        });

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeDefined();
        expect(mockResponse.locals?.apiUser.userId).toBe('123');
    });

    it('should call next() without user if API key is invalid', async () => {
        mockRequest.query = { apiKey: 'invalid_key' };

        // Mock failure flow
        (authService.getValidToken as jest.Mock).mockRejectedValue(new Error('API Key inválida'));

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        // El middleware captura el error, loguea warn y llama next()
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeUndefined();
    });
});
