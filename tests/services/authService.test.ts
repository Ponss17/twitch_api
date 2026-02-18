jest.mock('@/services/infrastructure/dbService', () => ({
    getUser: jest.fn(),
    getUserByApiKey: jest.fn(),
    saveUser: jest.fn()
}));

jest.mock('axios');

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import axios from 'axios';
import * as dbService from '@/services/infrastructure/dbService';
import { getValidToken, regenerateApiKey, refreshUserToken } from '@/services/auth/authService';
import { StoredUser } from '@/types/twitch';

const mockStoredUser: StoredUser = {
    userId: '123',
    login: 'testuser',
    displayName: 'Test User',
    accessToken: 'valid_access_token',
    refreshToken: 'valid_refresh_token',
    expiresIn: 3600,
    obtainedAt: Date.now(),
    createdAt: '2026-01-01T00:00:00.000Z',
    apiKey: 'test-api-key',
    profileImageUrl: 'http://img.url'
};

describe('authService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getValidToken', () => {
        it('should return token if not expired', async () => {
            // Token obtenido hace 1 minuto, expira en 1 hora
            const freshUser = {
                ...mockStoredUser,
                obtainedAt: Date.now() - 60_000,
                expiresIn: 3600
            };

            (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(freshUser);

            const result = await getValidToken('test-api-key');

            expect(result.accessToken).toBe('valid_access_token');
            expect(result.userId).toBe('123');
        });

        it('should throw if API key is invalid', async () => {
            (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(null);

            await expect(getValidToken('bad-key')).rejects.toThrow('API Key inválida');
        });

        it('should attempt refresh if token is near expiration', async () => {
            // Token obtenido hace 59 minutos, expira en 1 hora (dentro de 5 min margin)
            const nearlyExpiredUser = {
                ...mockStoredUser,
                obtainedAt: Date.now() - 55 * 60 * 1000,
                expiresIn: 3600
            };

            (dbService.getUserByApiKey as jest.Mock).mockResolvedValue(nearlyExpiredUser);
            (dbService.getUser as jest.Mock).mockResolvedValue(nearlyExpiredUser);

            // El refresh fallará, pero como el token AÚN no ha expirado, retornará el token actual
            (axios.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

            const result = await getValidToken('test-api-key');

            // Debería retornar el token existente ya que aún no ha expirado del todo
            expect(result.accessToken).toBe('valid_access_token');
        });
    });

    describe('regenerateApiKey', () => {
        it('should generate a new API key', async () => {
            (dbService.getUser as jest.Mock).mockResolvedValue(mockStoredUser);

            const newKey = await regenerateApiKey('123');

            expect(newKey).toBeDefined();
            expect(typeof newKey).toBe('string');
            expect(newKey).not.toBe('test-api-key');
            expect(dbService.saveUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: '123',
                    apiKey: newKey
                })
            );
        });

        it('should throw if user not found', async () => {
            (dbService.getUser as jest.Mock).mockResolvedValue(null);

            await expect(regenerateApiKey('999')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('refreshUserToken', () => {
        it('should throw if user has no refresh token', async () => {
            (dbService.getUser as jest.Mock).mockResolvedValue({
                ...mockStoredUser,
                refreshToken: undefined
            });

            await expect(refreshUserToken('123')).rejects.toThrow();
        });

        it('should throw if user not found', async () => {
            (dbService.getUser as jest.Mock).mockResolvedValue(null);

            await expect(refreshUserToken('999')).rejects.toThrow();
        });
    });
});
