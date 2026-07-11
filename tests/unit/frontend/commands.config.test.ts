import { COMMAND_CONFIG } from '@/features/commands/lib/config';

const DOMAIN = 'https://www.losperris.dev/api/twitch';
const LOGIN = 'test_streamer';
const API_KEY = '00000000-0000-4000-8000-000000000001';

function baseQuery() {
    return `channel=${LOGIN}&apiKey=${encodeURIComponent(API_KEY)}`;
}

function maskCommand(cmd: string, secret: string): string {
    return secret ? cmd.split(secret).join('**************') : cmd;
}

describe('COMMAND_CONFIG generation', () => {
    it('followage nightbot: comando completo con apiKey de prueba', () => {
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
        expect(full).toContain(`channel=${LOGIN}&user=$(user)&apiKey=`);

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
        expect(url).toContain('&title=$(querystring)');
        expect(url).toContain('&user=$(user)');
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
        expect(url).toContain('/shoutout?');
        expect(url).toContain(`channel=${LOGIN}&touser=\${touser}&apiKey=`);
    });

    it('shoutout nightbot orden channel, touser, apiKey', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.shoutout.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            '',
            query
        );

        expect(url).toContain('/shoutout?');
        expect(url).toContain(`channel=${LOGIN}&touser=$(touser)&apiKey=`);
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
        expect(full).toContain('&question=$(querystring)');
        expect(full).toContain('/minigames/magic8?');
        expect(full).toContain(`channel=${LOGIN}&question=$(querystring)&user=$(user)&mood=sarcastic&apiKey=`);
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
        expect(full).toContain('/minigames/russian?');
        expect(full).toContain(`channel=${LOGIN}&user=$(user)&hardcore=true&apiKey=`);
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
        expect(full).toContain('/minigames/duel?');
        expect(full).toContain(`channel=${LOGIN}&challenger=$(user)&target=$(1)&apiKey=`);
    });
});
