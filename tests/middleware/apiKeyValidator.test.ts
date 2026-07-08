import { apiKeyValidator } from '../../backend/src/core/middleware/apiKeyValidator';
import { Request, Response } from 'express';
import * as authService from '../../backend/src/features/auth/auth.service';
import * as dbService from '../../backend/src/core/database/dbService';
import * as cacheService from '../../backend/src/core/database/cacheService';

// Mock de servicios
jest.mock('../../backend/src/core/database/dbService', () => ({
    getUser: jest.fn(),
    getUserByApiKey: jest.fn(),
    addSystemLog: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../backend/src/core/database/cacheService', () => ({
    getCachedApiUser: jest.fn().mockResolvedValue(null),
    getCachedApiUserMeta: jest.fn().mockResolvedValue(null),
    setCachedApiUser: jest.fn().mockResolvedValue(undefined),
    invalidateApiKeyCache: jest.fn().mockResolvedValue(undefined),
    isApiKeyRevoked: jest.fn().mockResolvedValue(false),
    revokeApiKeyGlobally: jest.fn().mockResolvedValue(undefined),
    clearApiKeyRevocation: jest.fn().mockResolvedValue(undefined),
    isKvWriteAvailable: jest.fn().mockReturnValue(false)
}));
jest.mock('../../backend/src/features/auth/auth.service');

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
        (authService.getValidTokenForUser as jest.Mock).mockReset();
        (dbService.getUser as jest.Mock).mockReset();
        (dbService.getUserByApiKey as jest.Mock).mockReset();
    });

    it('should call next() for a public route without API key', async () => {
        (mockRequest as unknown as { path: string }).path = '/health';
        (mockRequest as unknown as { originalUrl: string }).originalUrl = '/health';
        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeUndefined();
    });

    it('should call next() for a private route without API key (lo maneja authMiddleware)', async () => {
        (mockRequest as unknown as { path: string }).path = '/api/data';
        (mockRequest as unknown as { originalUrl: string }).originalUrl = '/api/data';
        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);
        expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next() and populate user if valid API key is provided', async () => {
        const validKey = '11111111-1111-4111-8111-111111111111';
        mockRequest.query = { apiKey: validKey };

        // Mock success flow
        (dbService.getUserByApiKey as jest.Mock).mockResolvedValue({
            userId: 'user123',
            isActive: true,
            accessToken: 'token'
        });
        (authService.getValidTokenForUser as jest.Mock).mockResolvedValue({
            accessToken: 'token',
            userId: 'user123'
        });

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(dbService.getUser).not.toHaveBeenCalled();
        expect(authService.getValidTokenForUser).toHaveBeenCalled();

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.locals?.apiUser).toBeDefined();
        expect(mockResponse.locals?.apiUser.userId).toBe('user123');
    });

    it('should return 401 if API key is invalid', async () => {
        mockRequest.query = { apiKey: '44444444-4444-4444-8444-444444444444' }; // Formato UUID válido pero inexistente

        // Mock failure flow
        (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(null);

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('followage con apiKey inválida responde texto plano HTTP 200 (Nightbot)', async () => {
        (mockRequest as { path: string }).path = '/followage';
        (mockRequest as { originalUrl: string }).originalUrl = '/followage';
        mockRequest.query = { apiKey: '00000000-0000-0000-0000-000000000000' };
        (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(null);

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalled();
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('returns 403 from KV meta when account is suspended without hitting getUser', async () => {
        const validKey = '22222222-2222-4222-8222-222222222222';
        mockRequest.query = { apiKey: validKey };

        (cacheService.getCachedApiUserMeta as jest.Mock).mockResolvedValue({
            userId: 'user-suspended',
            isActive: false
        });

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(dbService.getUser).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('falls through to OAuth when API key is revoked but Bearer token is present', async () => {
        const revokedKey = '33333333-3333-4333-8333-333333333333';
        mockRequest.headers = {
            authorization: 'Bearer twitch-oauth-token',
            'x-api-key': revokedKey
        };

        (cacheService.isApiKeyRevoked as jest.Mock).mockResolvedValue(true);

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('clears stale revocation when API key is still active in DB', async () => {
        const activeKey = '55555555-5555-4555-8555-555555555555';
        mockRequest.headers = { 'x-api-key': activeKey };

        (cacheService.isApiKeyRevoked as jest.Mock).mockResolvedValue(true);
        (dbService.getUserByApiKey as jest.Mock).mockResolvedValue({
            userId: 'user-active',
            isActive: true,
            accessToken: 'token'
        });
        (authService.getValidTokenForUser as jest.Mock).mockResolvedValue({
            accessToken: 'token',
            userId: 'user-active'
        });

        await apiKeyValidator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(cacheService.clearApiKeyRevocation).toHaveBeenCalledWith(activeKey);
        expect(nextFunction).toHaveBeenCalled();
    });
});
