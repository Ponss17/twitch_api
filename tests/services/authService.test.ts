jest.mock('../../src/core/database/dbService', () => ({
    getUser: jest.fn(),
    getUserByApiKey: jest.fn(),
    saveUser: jest.fn()
}));

jest.mock('axios');

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import axios from 'axios';
import * as dbService from '../../src/core/database/dbService';
import {
    getValidToken,
    regenerateApiKey,
    refreshUserToken,
    handleCallback
} from '../../src/features/auth/auth.service';
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

    describe('handleCallback', () => {
        const mockTwitchUser = {
            id: '123',
            login: 'testuser',
            display_name: 'Test User',
            profile_image_url: 'http://img.url'
        };

        const mockTokenResponse = {
            data: {
                access_token: 'new_access_token',
                refresh_token: 'new_refresh_token',
                expires_in: 3600
            }
        };

        const mockUserResponse = {
            data: {
                data: [mockTwitchUser]
            }
        };

        it('should preserve custom user data when user already exists', async () => {
            const existingUser: StoredUser = {
                ...mockStoredUser,
                customRateLimit: 500,
                isActive: false,
                blockedReason: 'Test reason',
                stats: { clips: 10 },
                totalRequests: 10,
                lastActive: '2026-02-23T00:00:00.000Z'
            };

            (dbService.getUser as jest.Mock).mockResolvedValue(existingUser);
            (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
            (axios.get as jest.Mock).mockResolvedValue(mockUserResponse);

            const result = await handleCallback('mock_code', 'mock_state');

            expect(result.user.id).toBe('123');
            expect(dbService.saveUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: '123',
                    customRateLimit: 500,
                    isActive: false,
                    blockedReason: 'Test reason',
                    stats: { clips: 10 },
                    totalRequests: 10,
                    lastActive: '2026-02-23T00:00:00.000Z',
                    createdAt: '2026-01-01T00:00:00.000Z' // preserved
                })
            );
        });

        it('should use default values for new users', async () => {
            (dbService.getUser as jest.Mock).mockResolvedValue(null);
            (axios.post as jest.Mock).mockResolvedValue(mockTokenResponse);
            (axios.get as jest.Mock).mockResolvedValue(mockUserResponse);

            await handleCallback('mock_code', 'mock_state');

            expect(dbService.saveUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: '123',
                    isActive: true, // default
                    customRateLimit: undefined // default
                })
            );
        });
    });
});
