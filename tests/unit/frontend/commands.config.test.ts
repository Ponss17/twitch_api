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
        expect(full).toContain(`channel=${LOGIN}&user=$(touser)&apiKey=`);

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
        expect(url).toContain('VoHiYo Clip creado por $(user):');
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

    it('shoutout fossabot usa $(touser)', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.shoutout.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'fossabot',
            '',
            query
        );

        expect(url).toContain('$(customapi');
        expect(url).toContain(`channel=${LOGIN}&touser=$(touser)&apiKey=`);
    });

    it('8ball streamelements codifica la pregunta con queryescape', () => {
        const query = baseQuery();
        const { full } = COMMAND_CONFIG.magic8.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamelements',
            '',
            query,
            { mood: 'classic' }
        );

        expect(full).toContain('&question=$(queryescape ${1:})');
    });

    it('clip no incluye wizebot ni fossabot como bots soportados', () => {
        expect(COMMAND_CONFIG.clip.excludedBots).toEqual(expect.arrayContaining(['wizebot', 'fossabot']));
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
        expect(full).toContain('&target=$(touser)');
        expect(full).toContain('/minigames/duel?');
        expect(full).toContain(`channel=${LOGIN}&challenger=$(user)&target=$(touser)&apiKey=`);
    });

    it('followage streamlabs usa {touser.name}', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.follow.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamlabs',
            '',
            query
        );

        expect(url).toContain('{readapi.');
        expect(url).toContain(`channel=${LOGIN}&user={touser.name}&apiKey=`);
    });

    it('8ball streamlabs usa {1:} para la pregunta', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.magic8.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamlabs',
            '',
            query,
            { mood: 'classic' }
        );

        expect(url).toContain('{readapi.');
        expect(url).toContain('&question={1:}');
        expect(url).toContain('&user={user.name}');
    });
});
