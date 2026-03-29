import { Response } from 'express';

jest.mock('../../src/core/database/dbService', () => ({
    recordUserRequest: jest.fn().mockResolvedValue(undefined),
    addUserActivity: jest.fn().mockResolvedValue(undefined),
    incrementUserStats: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/features/games/magic8.service', () => ({
    generateMagic8Response: jest.fn()
}));

jest.mock('../../src/features/games/russian.service', () => ({
    playRussianRoulette: jest.fn()
}));

jest.mock('../../src/features/games/duel.service', () => ({
    playDuel: jest.fn()
}));

jest.mock('@/core/utils/twitchAuthHelpers', () => ({
    withTwitchAuth: jest.fn((_req, _res, action, _ctx) => action('mock_token'))
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as dbService from '../../src/core/database/dbService';
import { generateMagic8Response } from '../../src/features/games/magic8.service';
import { playRussianRoulette } from '../../src/features/games/russian.service';
import { playDuel } from '../../src/features/games/duel.service';
import { askMagic8, playRussian, startDuel } from '../../src/features/games/games.controller';
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

            (playDuel as jest.Mock).mockResolvedValue({ message: '¡Hero gana!' });

            await startDuel(req, res);

            expect(playDuel).toHaveBeenCalledWith('Hero', 'Enemy');
            expect(dbService.addUserActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({ type: 'duel', user: 'Hero', detail: 'Enemy' })
            );
            expect(res.send).toHaveBeenCalledWith('¡Hero gana!');
        });

        it('should use default challenger name if not provided', async () => {
            const req = mockReq({ query: { target: 'Enemy' } });
            const res = mockRes();

            (playDuel as jest.Mock).mockResolvedValue({ message: 'Keanu Reeves gana!' });

            await startDuel(req, res);

            expect(playDuel).toHaveBeenCalledWith('Keanu Reeves', 'Enemy');
        });
    });
});
