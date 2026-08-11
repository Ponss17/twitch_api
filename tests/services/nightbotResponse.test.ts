import {
    isAllowedNightbotResponseUrl,
    postNightbotMessage
} from '../../backend/src/features/integrations/nightbotResponse';
import {
    playSlotsSchema,
    startDuelSchema
} from '../../backend/src/features/minigames/minigames.schema';

describe('Nightbot response security', () => {
    it('acepta solo HTTPS Nightbot sin credenciales ni puertos alternos', () => {
        expect(isAllowedNightbotResponseUrl('https://api.nightbot.tv/send')).toBe(true);
        expect(isAllowedNightbotResponseUrl('https://nightbot.tv.evil.test/send')).toBe(false);
        expect(isAllowedNightbotResponseUrl('https://user:pass@nightbot.tv/send')).toBe(false);
        expect(isAllowedNightbotResponseUrl('https://nightbot.tv:8443/send')).toBe(false);
    });

    it('envía con timeout y sin seguir redirects', async () => {
        const fetchMock = jest
            .spyOn(global, 'fetch')
            .mockResolvedValue(new Response('', { status: 200 }));

        await postNightbotMessage('https://api.nightbot.tv/send', 'mensaje');

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.nightbot.tv/send',
            expect.objectContaining({
                method: 'POST',
                redirect: 'error',
                signal: expect.any(AbortSignal)
            })
        );
        fetchMock.mockRestore();
    });
});

describe('Nightbot interval schemas', () => {
    it.each([4, 11])('rechaza interval=%s fuera de 5–10s', (interval) => {
        expect(
            startDuelSchema.safeParse({
                query: { target: 'target', interval: String(interval) }
            }).success
        ).toBe(false);
    });

    it('coacciona interval válido y aplica default', () => {
        const duel = startDuelSchema.parse({ query: { target: 'target', interval: '10' } });
        const slots = playSlotsSchema.parse({ query: { user: 'viewer' } });
        expect(duel.query.interval).toBe(10);
        expect(slots.query.interval).toBe(5);
    });
});
