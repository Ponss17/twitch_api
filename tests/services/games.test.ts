jest.mock('@/features/twitch/twitch.service', () => ({
    sendChatMessage: jest.fn().mockResolvedValue(undefined),
    timeoutUser: jest.fn().mockResolvedValue(undefined),
    getUserId: jest.fn().mockImplementation((u) => Promise.resolve(`id_${u}`))
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

jest.mock('@/core/database/redisClient');

import { playDuel } from '../../backend/src/features/games/duel.service';
import { playRussianRoulette } from '../../backend/src/features/games/russian.service';

describe('juegos (duel, russian roulette)', () => {
    describe('playDuel', () => {
        it('retorna ganador, perdedor, 3 mensajes y relato unido', () => {
            const { winner, loser, message, messages } = playDuel('u1', 'u2');

            expect(winner).not.toBe(loser);
            expect(['u1', 'u2']).toContain(winner);
            expect(['u1', 'u2']).toContain(loser);
            expect(messages).toHaveLength(3);
            expect(messages[0]).toContain('@u1');
            expect(messages[0]).toContain('@u2');
            expect(message).toMatch(/^⚔️ /);
            expect(message).toContain(winner);
            expect(message).toContain(loser);
        });
    });

    describe('playRussianRoulette', () => {
        it('retorna status vivo o muerto y un mensaje descriptivo', async () => {
            const res = await playRussianRoulette('ch1', 'u1', 'token', false, false);

            expect(['alive', 'dead']).toContain(res.status);
            expect(res.message).toBeTruthy();
        });

        it('no aplica timeout al streamer aunque pierda (hardcore)', async () => {
            // Forzamos muerte poniendo bullet == chamber
            jest.spyOn(Math, 'random').mockReturnValue(0.1);

            // Misma ID para streamer y trigger
            const res = await playRussianRoulette('streamer', 'streamer', 'token', true, false);

            expect(res.status).toBe('dead');
            expect(res.message).toContain('El Streamer es inmortal');
        });
    });
});
