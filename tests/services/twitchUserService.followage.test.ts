jest.mock('../../backend/src/core/database/cacheService', () => ({
    getCachedUserId: jest.fn().mockResolvedValue(null),
    setCachedUserId: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn()
}));

jest.mock('../../backend/src/features/twitch/twitchClient', () => ({
    apiClient: { get: jest.fn() },
    checkCircuit: jest.fn().mockResolvedValue(undefined),
    recordSuccess: jest.fn(),
    handleTwitchError: jest.fn((error: unknown) => {
        throw error;
    }),
    getHeaders: jest.fn(() => ({ Authorization: 'Bearer test', 'Client-ID': 'test' }))
}));

import * as cacheService from '../../backend/src/core/database/cacheService';
import { apiClient } from '../../backend/src/features/twitch/twitchClient';
import { getFollowAge, invalidateUserInfoCache } from '../../backend/src/features/twitch/twitchUserService';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('getFollowAge', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        for (const login of ['ponss17', 'otrocanal', 'mynaana17', 'viewer1', 'usuario_falso']) {
            invalidateUserInfoCache(login);
        }
        (cacheService.getCachedUserId as jest.Mock).mockResolvedValue(null);
    });

    it('devuelve mensaje claro si el canal no existe', async () => {
        mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

        const result = await getFollowAge('mynaana17', 'ponss17', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toContain('mynaana17');
        expect(result.text).toContain('no existe en Twitch');
    });

    it('devuelve mensaje claro si el usuario no existe', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({ data: { data: [] } });

        const result = await getFollowAge('ponss17', 'usuario_falso', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toContain('usuario_falso');
        expect(result.text).toContain('no existe en Twitch');
    });

    it('devuelve mensaje si no hay permiso para consultar otro canal', async () => {
        (cacheService.getCachedUserId as jest.Mock).mockResolvedValue(null);

        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'otrocanal' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'ponss17' }] }
            })
            .mockRejectedValueOnce(
                Object.assign(new Error('Forbidden'), {
                    isAxiosError: true,
                    response: { status: 403, data: { message: 'Forbidden' } }
                })
            );

        const result = await getFollowAge('otrocanal', 'ponss17', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toContain('otrocanal');
        expect(result.text).toContain('channel debe ser el login de TU canal');
    });

    it('devuelve followage cuando el usuario sí sigue al canal', async () => {
        (cacheService.getCachedUserId as jest.Mock)
            .mockResolvedValueOnce('111')
            .mockResolvedValueOnce('222');

        mockedApiClient.get.mockResolvedValueOnce({
            data: {
                data: [{ followed_at: '2020-01-15T12:00:00Z' }]
            }
        });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).not.toBe('error');
        expect(result.text).toContain('viewer1 ha seguido a ponss17');
    });
});
