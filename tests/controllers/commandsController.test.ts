import { Response } from 'express';

jest.mock('../../src/core/database/dbService', () => ({
    recordUserRequest: jest.fn().mockResolvedValue(undefined),
    addUserActivity: jest.fn().mockResolvedValue(undefined),
    incrementUserStats: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn()
}));

jest.mock('../../src/features/twitch/twitch.service', () => ({
    createClip: jest.fn(),
    getFollowage: jest.fn(),
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
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '../../src/core/database/dbService';
import * as apiService from '../../src/features/twitch/twitch.service';
import {
    createClip,
    sendMessage,
    getShoutout
} from '../../src/features/commands/commands.controller';
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

            expect(dbService.incrementUserStats).toHaveBeenCalledWith('123', 'clips');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    type: 'clip',
                    user: 'TestUser',
                    detail: 'testchannel (Stream Original)'
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
                    detail: 'testchannel (Mi Jugada)'
                })
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
                    detail: 'testchannel (Valorant con amigos)'
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
                expect.objectContaining({ type: 'message' })
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
                expect.objectContaining({ type: 'shoutout', user: 'TargetUser' })
            );
        });
    });
});
