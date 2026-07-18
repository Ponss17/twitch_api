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
import {
    getFollowAge,
    getFollowersCountSafe,
    isStreamLiveSafe,
    invalidateUserInfoCache
} from '../../backend/src/features/twitch/twitchUserService';
import { TwitchApiError } from '../../backend/src/core/errors/AppError';

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
            .mockRejectedValueOnce(new TwitchApiError('Forbidden', 403));

        const result = await getFollowAge('otrocanal', 'ponss17', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toContain('otrocanal');
        expect(result.text).toMatch(/dueño o moderador|actualizar permisos/i);
    });

    it('trata data vacía con total>0 y probe vacío como falta de permiso', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [], total: 15420 }
            })
            // validateToken (OAuth scopes)
            .mockResolvedValueOnce({
                data: {
                    client_id: 'x',
                    login: 'ponss17',
                    scopes: ['moderator:read:followers'],
                    user_id: '111',
                    expires_in: 3600
                }
            })
            // probe sin user_id: también vacío → sin permiso real
            .mockResolvedValueOnce({
                data: { data: [], total: 15420 }
            });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toMatch(/dueño o moderador|actualizar permisos/i);
        expect(result.text).not.toContain('no sigue');
    });

    it('con total>0 vacío pero probe con filas → "no sigue" (permiso OK)', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [], total: 15420 }
            })
            .mockResolvedValueOnce({
                data: {
                    client_id: 'x',
                    login: 'ponss17',
                    scopes: ['moderator:read:followers'],
                    user_id: '111',
                    expires_in: 3600
                }
            })
            .mockResolvedValueOnce({
                data: {
                    data: [
                        {
                            user_id: '999',
                            user_login: 'alguien',
                            followed_at: '2020-01-01T00:00:00Z'
                        }
                    ],
                    total: 15420
                }
            });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).toBe('no sigue');
        expect(result.text).toContain('viewer1 no sigue a ponss17');
    });

    it('pide re-login si falta el scope moderator:read:followers', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [], total: 15420 }
            })
            .mockResolvedValueOnce({
                data: {
                    client_id: 'x',
                    login: 'ponss17',
                    scopes: ['user:read:email'],
                    user_id: '111',
                    expires_in: 3600
                }
            });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).toBe('error');
        expect(result.text).toContain('moderator:read:followers');
    });

    it('devuelve "no sigue" solo cuando total es 0 y hay scope', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [], total: 0 }
            })
            .mockResolvedValueOnce({
                data: {
                    client_id: 'x',
                    login: 'ponss17',
                    scopes: ['moderator:read:followers'],
                    user_id: '111',
                    expires_in: 3600
                }
            });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).toBe('no sigue');
        expect(result.text).toContain('viewer1 no sigue a ponss17');
    });

    it('relanza 401 si validateToken indica token inválido', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [], total: 15420 }
            })
            .mockRejectedValueOnce(
                Object.assign(new Error('Unauthorized'), {
                    isAxiosError: true,
                    response: { status: 401 }
                })
            );

        await expect(getFollowAge('ponss17', 'viewer1', 'token')).rejects.toMatchObject({
            statusCode: 401
        });
    });

    it('relanza 401 para permitir refresh del token', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockRejectedValueOnce(new TwitchApiError('Unauthorized', 401));

        await expect(getFollowAge('ponss17', 'viewer1', 'token')).rejects.toMatchObject({
            statusCode: 401
        });
    });

    it('devuelve followage cuando el usuario sí sigue al canal', async () => {
        mockedApiClient.get
            .mockResolvedValueOnce({
                data: { data: [{ id: '111', login: 'ponss17' }] }
            })
            .mockResolvedValueOnce({
                data: { data: [{ id: '222', login: 'viewer1' }] }
            })
            .mockResolvedValueOnce({
                data: {
                    data: [{ followed_at: '2020-01-15T12:00:00Z' }],
                    total: 1
                }
            });

        const result = await getFollowAge('ponss17', 'viewer1', 'token');

        expect(result.timePhrase).not.toBe('error');
        expect(result.text).toContain('viewer1 ha seguido a ponss17');
    });
});

describe('getFollowersCountSafe / isStreamLiveSafe (perfil degradado)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (cacheService.get as jest.Mock).mockResolvedValue(null);
    });

    it('getFollowersCountSafe devuelve el total cuando Twitch responde', async () => {
        mockedApiClient.get.mockResolvedValueOnce({ data: { total: 1234 } });

        await expect(getFollowersCountSafe('111', 'token')).resolves.toBe(1234);
    });

    it('getFollowersCountSafe devuelve undefined (no 0) cuando falta el scope', async () => {
        mockedApiClient.get.mockRejectedValueOnce(new TwitchApiError('Missing scope', 401));

        await expect(getFollowersCountSafe('111', 'token')).resolves.toBeUndefined();
    });

    it('isStreamLiveSafe devuelve undefined cuando Twitch falla', async () => {
        mockedApiClient.get.mockRejectedValueOnce(new TwitchApiError('Boom', 503));

        await expect(isStreamLiveSafe('111', 'token')).resolves.toBeUndefined();
    });
});
