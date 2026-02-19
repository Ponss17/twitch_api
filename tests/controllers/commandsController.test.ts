import { Response } from 'express';

jest.mock('@/services/infrastructure/dbService', () => ({
    recordUserRequest: jest.fn().mockResolvedValue(undefined),
    addUserActivity: jest.fn().mockResolvedValue(undefined),
    incrementUserStats: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn()
}));

jest.mock('@/services/twitch/apiService', () => ({
    createClip: jest.fn(),
    getFollowage: jest.fn(),
    sendChatMessage: jest.fn(),
    getUserId: jest.fn(),
    getChannelInfo: jest.fn()
}));

jest.mock('@/services/infrastructure/cacheService', () => ({
    get: jest.fn(),
    set: jest.fn(),
    getCachedUserId: jest.fn(),
    setCachedUserId: jest.fn()
}));

jest.mock('@/utils/twitchAuthHelpers', () => ({
    withTwitchAuth: jest.fn((_req, _res, action, _ctx) => action('mock_token'))
}));

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '@/services/infrastructure/dbService';
import * as apiService from '@/services/twitch/apiService';
import { createClip, sendMessage, getShoutout } from '@/controllers/twitch/commandsController';
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

            (apiService.createClip as jest.Mock).mockResolvedValue('https://clips.twitch.tv/test');

            await createClip(req, res);

            expect(dbService.incrementUserStats).toHaveBeenCalledWith('123', 'clips');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.stringContaining('creó un clip')
            );
        });

        it('should return 400 if no channel provided', async () => {
            const req = mockReq({ query: {} });
            const res = mockRes();

            await createClip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
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
                expect.stringContaining('envió mensaje al chat')
            );
        });

        it('should return 400 if no message provided', async () => {
            const req = mockReq({ body: {} });
            const res = mockRes();

            await sendMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
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
                expect.stringContaining('recibió un shoutout')
            );
        });

        it('should return 400 if no target user or channel', async () => {
            const req = mockReq({ query: {} });
            const res = mockRes();

            await getShoutout(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
