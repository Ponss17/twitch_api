import { Response } from 'express';

jest.mock('../../backend/src/core/database/dbService', () => ({
    recordUserRequest: jest.fn().mockResolvedValue(undefined),
    addUserActivity: jest.fn().mockResolvedValue(undefined),
    incrementUserStats: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/features/games/magic8.service', () => ({
    __esModule: true,
    generateMagic8Response: jest.fn()
}));

jest.mock('../../backend/src/features/games/russian.service', () => ({
    playRussianRoulette: jest.fn()
}));

jest.mock('../../backend/src/features/games/duel.service', () => ({
    playDuel: jest.fn(),
    getNightbotResponseUrl: jest.fn().mockReturnValue(null),
    scheduleNightbotFollowUps: jest.fn().mockResolvedValue(undefined),
    keepAliveAfterResponse: jest.fn()
}));

jest.mock('@/core/utils/twitchAuthHelpers', () => ({
    withTwitchAuth: jest.fn((_req, _res, action, _ctx) => action('mock_token'))
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '../../backend/src/core/database/dbService';
import { generateMagic8Response } from '../../backend/src/features/games/magic8.service';
import { playRussianRoulette } from '../../backend/src/features/games/russian.service';
import {
    playDuel,
    getNightbotResponseUrl,
    scheduleNightbotFollowUps,
    keepAliveAfterResponse
} from '../../backend/src/features/games/duel.service';
import { askMagic8, playRussian, startDuel } from '../../backend/src/features/games/games.controller';
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

describe('gamesController', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('askMagic8', () => {
        it('should return an answer and track activity', async () => {
            const req = mockReq({ query: { question: '¿Voy a ganar?', user: 'Player1' } });
            const res = mockRes();

            (generateMagic8Response as jest.Mock).mockResolvedValue('Sí, definitivamente');

            await askMagic8(req, res);

            expect(generateMagic8Response).toHaveBeenCalled();
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({ type: 'magic8', user: 'Player1' })
            );
            expect(res.send).toHaveBeenCalledWith('Sí, definitivamente');
        });

        it('should return 500 on service error', async () => {
            const req = mockReq({ query: { question: 'Test?' } });
            const res = mockRes();

            (generateMagic8Response as jest.Mock).mockRejectedValue(new Error('Groq down'));

            await askMagic8(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('playRussian', () => {
        it('should return result and track activity', async () => {
            const req = mockReq({
                query: { user: 'Player1', channel: 'testchannel', format: 'json' }
            });
            const res = mockRes();

            (playRussianRoulette as jest.Mock).mockResolvedValue({
                message: '¡Sobreviviste!',
                survived: true
            });

            await playRussian(req, res);

            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({ type: 'russian', user: 'Player1' })
            );
            expect(res.json).toHaveBeenCalled();
        });

        it('should return 401 if no twitchToken', async () => {
            const req = mockReq({ twitchToken: undefined, query: { user: 'p' } });
            const res = mockRes();

            await playRussian(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('startDuel', () => {
        it('should start duel and track activity', async () => {
            const req = mockReq({ query: { target: 'Enemy', challenger: 'Hero' } });
            const res = mockRes();

            (playDuel as jest.Mock).mockReturnValue({
                message: '¡Hero gana!',
                messages: ['a', 'b', 'c'],
                winner: 'Hero',
                loser: 'Enemy'
            });

            await startDuel(req, res);

            expect(playDuel).toHaveBeenCalledWith('Hero', 'Enemy', 'es');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({ type: 'duel', user: 'Hero', metadata: { target: 'Enemy' } })
            );
            // Sin Nightbot-Response-Url → un solo mensaje
            expect(res.send).toHaveBeenCalledWith('¡Hero gana!');
            expect(scheduleNightbotFollowUps).not.toHaveBeenCalled();
        });

        it('should use default challenger name if not provided', async () => {
            const req = mockReq({ query: { target: 'Enemy' } });
            const res = mockRes();

            (playDuel as jest.Mock).mockReturnValue({
                message: 'Keanu Reeves gana!',
                messages: ['a', 'b', 'c'],
                winner: 'KeanuReeves',
                loser: 'Enemy'
            });

            await startDuel(req, res);

            expect(playDuel).toHaveBeenCalledWith('KeanuReeves', 'Enemy', 'es');
        });

        it('should chain Nightbot messages via Response-Url', async () => {
            const responseUrl = 'https://api.nightbot.tv/1/channel/send/token';
            (getNightbotResponseUrl as jest.Mock).mockReturnValue(responseUrl);

            const req = mockReq({
                query: { target: 'Enemy', challenger: 'Hero', interval: '5' }
            });
            const res = mockRes();
            const messages = ['reto', 'pelea', 'ganador'];

            (playDuel as jest.Mock).mockReturnValue({
                message: '⚔️ reto pelea ganador',
                messages,
                winner: 'Hero',
                loser: 'Enemy'
            });

            await startDuel(req, res);

            expect(res.send).toHaveBeenCalledWith('reto');
            expect(scheduleNightbotFollowUps).toHaveBeenCalledWith(
                responseUrl,
                ['pelea', 'ganador'],
                5
            );
            expect(keepAliveAfterResponse).toHaveBeenCalled();

            (getNightbotResponseUrl as jest.Mock).mockReturnValue(null);
        });
    });
});
