import { COMMAND_CONFIG, DEFAULT_CLIP_TEMPLATE } from '@/features/commands/lib/config';

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
        expect(full).toContain('/followage/?');
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

    it('clip nightbot: plantilla por defecto en la API (sin mezclar texto)', () => {
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
        expect(url).toMatch(/^\$\(urlfetch .+\)$/);
        expect(url).not.toContain('Clip creado');
        expect(url).toContain(`template=${encodeURIComponent(DEFAULT_CLIP_TEMPLATE)}`);
        expect(url).toContain('&title=$(querystring)');
        expect(url).toContain('&user=$(user)');
    });

    it('clip nightbot: plantilla personalizada también va en la API', () => {
        const query = baseQuery();
        const template = '¡Miren este clip de {user}! 👉 {url}';
        const { url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'nightbot',
            template,
            query
        );

        expect(url).toMatch(/^\$\(urlfetch .+\)$/);
        expect(url).not.toContain('¡Miren');
        expect(url).toContain(`template=${encodeURIComponent(template)}`);
    });

    it('clip streamelements: plantilla por defecto y variables nativas', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamelements',
            '',
            query
        );

        expect(url).toContain('$(customapi');
        expect(url).toContain(`template=${encodeURIComponent(DEFAULT_CLIP_TEMPLATE)}`);
        expect(url).toContain('&user=${user}');
        expect(url).toContain('&title=${args}');
    });

    it('clip streamlabs: plantilla por defecto y readapi', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'streamlabs',
            '',
            query
        );

        expect(url).toMatch(/^\{readapi\..+\}$/);
        expect(url).toContain(`template=${encodeURIComponent(DEFAULT_CLIP_TEMPLATE)}`);
        expect(url).toContain('&user={user.name}');
    });

    it('clip botrix: plantilla en URL, comando solo $(urlfetch) (sin texto mezclado)', () => {
        const query = baseQuery();
        const template = 'Clip creado por {user}: {url}';
        const { full, url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'botrix',
            template,
            query
        );

        expect(url).toMatch(/^\$\(urlfetch .+\)$/);
        expect(url).not.toContain('Clip creado');
        expect(url).toContain(`template=${encodeURIComponent(template)}`);
        expect(url).toContain('&user=$(sender)');
        expect(url).toContain('&title=$(urlencode $(optionalvariable))');
        expect(full).toBe(`!addcom !clip ${url}`);
    });

    it('clip botrix sin plantilla usa la plantilla por defecto en la API', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.clip.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'botrix',
            '',
            query
        );

        expect(url).toMatch(/^\$\(urlfetch .+\)$/);
        expect(url).toContain(`template=${encodeURIComponent(DEFAULT_CLIP_TEMPLATE)}`);
    });

    it('followage botrix usa $(urlfetch) y variables nativas', () => {
        const query = baseQuery();
        const { url } = COMMAND_CONFIG.follow.generate(
            DOMAIN,
            LOGIN,
            `apiKey=${encodeURIComponent(API_KEY)}`,
            'botrix',
            '',
            query
        );

        expect(url).toMatch(/^\$\(urlfetch .+\)$/);
        expect(url).toContain('&user=$(sender)');
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
        expect(url).toContain('&touser=${1}');
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
        expect(full).toContain('/minigames/magic8/?');
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
        expect(full).toContain('&target=$(touser)');
    });
});
