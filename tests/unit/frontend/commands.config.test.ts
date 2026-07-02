import { COMMAND_CONFIG } from '@/features/commands/lib/config';

const DOMAIN = 'https://www.losperris.dev/api/twitch';
const LOGIN = 'ponss17';
const API_KEY = 'd283c8db-7198-474f-a81d-187c765847dc';

function baseQuery() {
    return `channel=${LOGIN}&apiKey=${encodeURIComponent(API_KEY)}`;
}

function maskCommand(cmd: string, secret: string): string {
    return secret ? cmd.split(secret).join('**************') : cmd;
}

describe('COMMAND_CONFIG generation', () => {
    it('followage nightbot: comando completo con apiKey real', () => {
        const query = baseQuery();
        const { full, url } = COMMAND_CONFIG.follow.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query
        );

        expect(full).toBe(`!addcom !followage ${url}`);
        expect(full).toContain(API_KEY);
        expect(full).toContain('$(urlfetch');
        expect(full).toContain('/followage?');
        expect(full).toContain('&user=$(user)');

        const masked = maskCommand(full, API_KEY);
        expect(masked).not.toContain(API_KEY);
        expect(masked).toContain('**************');
    });

    it('followage: plantilla personalizada se codifica en la URL', () => {
        const query = baseQuery();
        const template = '{user} lleva {time} siguiendo';
        const { full } = COMMAND_CONFIG.follow.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            template,
            query
        );

        expect(full).toContain(
            `template=${encodeURIComponent(template)}`
        );
    });

    it('clip: modo url copia solo el mensaje sin !addcom', () => {
        const query = baseQuery();
        const { full, url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query
        );

        expect(full).toBe(`!addcom !clip ${url}`);
        expect(url).toContain('$(urlfetch');
        expect(url).toContain('/create-clip?');
        expect(url).toContain('&title=$(1+)');
    });

    it('shoutout streamelements usa variables del bot', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.shoutout.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamelements',
            '',
            query
        );

        expect(url).toContain('$(customapi');
        expect(url).toContain('&touser=${touser}');
    });

    it('8ball incluye mood y question en query', () => {
        const query = baseQuery();
        const { full } = COMMAND_CONFIG.magic8.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query,
            { mood: 'sarcastic' }
        );

        expect(full).toContain('&mood=sarcastic');
        expect(full).toContain('&question=$(1+)');
        expect(full).toContain('/minigames/magic8?');
    });

    it('ruleta hardcore activado', () => {
        const query = baseQuery();
        const { full } = COMMAND_CONFIG.russian.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query,
            { hardcore: 'true' }
        );

        expect(full).toContain('&hardcore=true');
    });

    it('duelo incluye challenger y target', () => {
        const query = baseQuery();
        const { full } = COMMAND_CONFIG.duel.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query
        );

        expect(full).toContain('&challenger=$(user)');
        expect(full).toContain('&target=$(1)');
    });
});
