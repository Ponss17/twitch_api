import { Response } from 'express';

jest.mock('../../backend/src/core/database/dbService', () => ({
    recordUserRequest: jest.fn().mockResolvedValue(undefined),
    addUserActivity: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn()
}));

jest.mock('../../backend/src/features/twitch/twitch.service', () => ({
    createClip: jest.fn(),
    getFollowAge: jest.fn(),
    sendChatMessage: jest.fn(),
    getUserId: jest.fn(),
    getChannelInfo: jest.fn()
}));

jest.mock('@/core/database/cacheService', () => ({
    get: jest.fn(),
    set: jest.fn(),
    getCachedUserId: jest.fn(),
    setCachedUserId: jest.fn()
}));

jest.mock('@/core/utils/twitchAuthHelpers', () => ({
    withTwitchAuth: jest.fn((_req, _res, action, _ctx) => action('mock_token'))
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

jest.mock('../../backend/src/features/integrations/streamelements.service', () => ({
    getStreamElementsWatchtime: jest.fn()
}));

import * as dbService from '../../backend/src/core/database/dbService';
import * as apiService from '../../backend/src/features/twitch/twitch.service';
import * as cacheService from '../../backend/src/core/database/cacheService';
import {
    createClip,
    sendMessage,
    getShoutout,
    followage,
    watchtime
} from '../../backend/src/features/commands/commands.controller';
import { getStreamElementsWatchtime } from '../../backend/src/features/integrations/streamelements.service';
import { AuthenticatedRequest } from '@/types/twitch';

const mockReq = (overrides = {}) =>
    ({
        userId: '123',
        displayName: 'TestUser',
        twitchToken: 'test_token',
        query: {},
        body: {},
        headers: {},
        ...overrides
    }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};

describe('commandsController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createClip', () => {
        it('should create a clip and track activity', async () => {
            const req = mockReq({ query: { channel: 'testchannel' } });
            const res = mockRes();

            (apiService.getUserId as jest.Mock).mockResolvedValue('test_id');
            (apiService.getChannelInfo as jest.Mock).mockResolvedValue({
                title: 'Stream Original'
            });
            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/test');

            await createClip(req, res);

            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    type: 'clip',
                    user: 'TestUser',
                    metadata: expect.objectContaining({ title: expect.any(String) })
                })
            );
        });

        it('should use custom title if provided in q', async () => {
            const req = mockReq({
                query: {
                    channel: 'testchannel',
                    q: 'Mi Jugada',
                    template: 'Clip: {title} en {url}'
                }
            });
            const res = mockRes();

            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/test');

            await createClip(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'Clip: Mi Jugada en https://clips.twitch.tv/test'
            );
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    metadata: expect.objectContaining({ title: 'Mi Jugada' })
                })
            );
        });

        it('should replace {user} in clip template from query', async () => {
            const req = mockReq({
                query: {
                    channel: 'testchannel',
                    user: 'snake_1719',
                    template: 'Clip creado por {user}: {url}'
                }
            });
            const res = mockRes();

            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/test');

            await createClip(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'Clip creado por snake_1719: https://clips.twitch.tv/test'
            );
        });

        it('reemplaza todas las apariciones de cada variable', async () => {
            const req = mockReq({
                query: {
                    channel: 'testchannel',
                    user: 'viewer',
                    q: 'Gol con $&',
                    template: '{user}/{user} {title}/{title} {url}/{url}'
                }
            });
            const res = mockRes();
            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/$&');

            await createClip(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'viewer/viewer Gol con $&amp;/Gol con $&amp; https://clips.twitch.tv/$&amp;/https://clips.twitch.tv/$&amp;'
            );
        });

        it('should fallback to stream title if no q/title provided', async () => {
            const req = mockReq({
                query: {
                    channel: 'testchannel',
                    template: 'Stream: {title}'
                }
            });
            const res = mockRes();

            (apiService.getUserId as jest.Mock).mockResolvedValue('test_id');
            (apiService.getChannelInfo as jest.Mock).mockResolvedValue({
                title: 'Valorant con amigos'
            });
            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/test');

            await createClip(req, res);

            expect(res.send).toHaveBeenCalledWith('Stream: Valorant con amigos');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    metadata: expect.objectContaining({ title: 'Valorant con amigos' })
                })
            );
        });
    });

    describe('sendMessage', () => {
        it('should send message and track activity', async () => {
            const req = mockReq({ body: { message: 'Hello World from chat!' } });
            const res = mockRes();

            (apiService.sendChatMessage as jest.Mock).mockResolvedValue(undefined);

            await sendMessage(req, res);

            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    type: 'message',
                    user: 'TestUser',
                    metadata: expect.objectContaining({ message: 'Hello World from chat!' })
                })
            );
        });
    });

    describe('followage', () => {
        it('clona entradas de caché sin mutar el objeto almacenado', async () => {
            const cachedEntry = {
                text: 'viewer ha seguido a channel por 1 día.',
                timePhrase: '1 día',
                followDateMs: Date.now() - 86_400_000
            };
            (cacheService.get as jest.Mock).mockResolvedValue(cachedEntry);

            const req = mockReq({ query: { channel: 'channel', user: 'viewer' } });
            const res = mockRes();

            await followage(req, res);

            expect(res.send).toHaveBeenCalled();
            expect(cachedEntry.text).toBe('viewer ha seguido a channel por 1 día.');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    type: 'followage',
                    metadata: { target: 'channel' }
                })
            );
        });

        it('no cachea respuestas con timePhrase error', async () => {
            (cacheService.get as jest.Mock).mockResolvedValue(null);
            (apiService.getFollowAge as jest.Mock).mockResolvedValue({
                text: 'No se puede consultar followage.',
                timePhrase: 'error'
            });

            const req = mockReq({ query: { channel: 'bad', user: 'viewer' } });
            const res = mockRes();

            await followage(req, res);

            expect(cacheService.set).not.toHaveBeenCalled();
            expect(res.send).toHaveBeenCalledWith('No se puede consultar followage.');
        });

        it('reemplaza todas las variables de la plantilla', async () => {
            (cacheService.get as jest.Mock).mockResolvedValue({
                text: 'cached',
                timePhrase: '2 meses'
            });
            const req = mockReq({
                query: {
                    channel: 'channel',
                    user: 'viewer',
                    template: '{user} {user} {time} {time} {channel} {channel}'
                }
            });
            const res = mockRes();

            await followage(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'viewer viewer 2 meses 2 meses channel channel'
            );
        });
    });

    describe('getShoutout', () => {
        it('should send shoutout and track activity', async () => {
            const req = mockReq({ query: { channel: 'testchannel', touser: 'TargetUser' } });
            const res = mockRes();

            (apiService.getUserId as jest.Mock).mockResolvedValue('target_id_456');
            (apiService.getChannelInfo as jest.Mock).mockResolvedValue({ game_name: 'Fortnite' });

            await getShoutout(req, res);

            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    type: 'shoutout',
                    metadata: expect.objectContaining({ target: 'TargetUser' })
                })
            );
        });

        it('reemplaza todas las apariciones en shoutout', async () => {
            (apiService.getUserId as jest.Mock).mockResolvedValue('target_id');
            (apiService.getChannelInfo as jest.Mock).mockResolvedValue({ game_name: 'Chess' });
            const req = mockReq({
                query: {
                    touser: 'TargetUser',
                    template: '{user}/{user} {game}/{game} {url}/{url}'
                }
            });
            const res = mockRes();

            await getShoutout(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'TargetUser/TargetUser Chess/Chess https://twitch.tv/TargetUser/https://twitch.tv/TargetUser'
            );
        });
    });

    describe('watchtime', () => {
        it('reemplaza todas las apariciones en watchtime', async () => {
            (cacheService.get as jest.Mock).mockResolvedValue(null);
            (getStreamElementsWatchtime as jest.Mock).mockResolvedValue({ minutes: 120 });
            const req = mockReq({
                query: {
                    channel: 'channel',
                    user: 'viewer',
                    template: '{user}/{user} {time}/{time} {channel}/{channel}'
                }
            });
            const res = mockRes();

            await watchtime(req, res);

            expect(res.send).toHaveBeenCalledWith(
                'viewer/viewer 2 horas/2 horas channel/channel'
            );
        });
    });
});
