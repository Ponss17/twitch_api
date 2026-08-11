jest.mock('@/features/twitch/twitch.service', () => ({
    sendChatMessage: jest.fn().mockResolvedValue(undefined),
    timeoutUser: jest.fn().mockResolvedValue(undefined),
    getUserId: jest.fn().mockImplementation((u) => Promise.resolve(`id_${u}`))
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

jest.mock('@/core/database/redisClient');

import { playDuel } from '../../backend/src/features/minigames/duel.service';
import { playRussianRoulette } from '../../backend/src/features/minigames/russian.service';
import { playSlots } from '../../backend/src/features/minigames/slots.service';
import { kv } from '@/core/database/redisClient';
import { timeoutUser } from '@/features/twitch/twitch.service';

describe('juegos (duel, russian roulette, slots)', () => {
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

    describe('playSlots', () => {
        it('retorna 3 mensajes Nightbot y un resultado final', () => {
            const { messages, message } = playSlots('u1', 'es');

            expect(messages).toHaveLength(3);
            expect(messages[0]).toContain('@u1');
            expect(messages[0]).toContain('❓');
            expect(message).toMatch(/^🎰 /);
            expect(message).toContain('@u1');
        });
    });

    describe('playRussianRoulette', () => {
        beforeEach(() => {
            (kv.eval as jest.Mock).mockResolvedValue([1, 1, 1]);
            (timeoutUser as jest.Mock).mockResolvedValue(undefined);
        });

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
            expect(res.hardcore_applied).toBe(false);
        });

        it('marca hardcore solo después de aplicar el timeout', async () => {
            const applied = await playRussianRoulette('streamer', 'viewer', 'token', true, false);
            expect(applied.hardcore_applied).toBe(true);

            (timeoutUser as jest.Mock).mockRejectedValueOnce(new Error('Twitch failed'));
            const failed = await playRussianRoulette('streamer', 'viewer', 'token', true, false);
            expect(failed.hardcore_applied).toBe(false);
        });

        it('serializa init, disparos y reset bajo concurrencia', async () => {
            let bullet: number | null = null;
            let chamber = 0;
            (kv.eval as jest.Mock).mockImplementation(async (_script, _keys, args) => {
                if (bullet === null) bullet = Number(args[0]);
                chamber += 1;
                const dead = chamber >= bullet;
                const result = [bullet, chamber, dead ? 1 : 0];
                if (dead) {
                    bullet = null;
                    chamber = 0;
                }
                return result;
            });
            jest.spyOn(Math, 'random').mockReturnValue(0.99);

            const round = await Promise.all(
                Array.from({ length: 6 }, () =>
                    playRussianRoulette('channel', 'viewer', 'token', false, false)
                )
            );
            expect(round.filter((result) => result.status === 'dead')).toHaveLength(1);

            const nextRound = await playRussianRoulette(
                'channel',
                'viewer',
                'token',
                false,
                false
            );
            expect(nextRound.status).toBe('alive');
        });
    });
});
