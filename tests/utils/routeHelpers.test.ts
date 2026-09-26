import { isPublicRoute, isPublicHtmlRoute, isBotCommand, isJsonApiRoute } from '../../backend/src/core/utils/routeHelpers';

describe('isPublicRoute', () => {
    it('trata el landing / como público (GET)', () => {
        expect(isPublicRoute('/', 'GET')).toBe(true);
        expect(isPublicRoute('/api/twitch/', 'GET')).toBe(true);
    });

    it('trata páginas Astro del dashboard como públicas (GET)', () => {
        expect(isPublicRoute('/dashboard', 'GET')).toBe(true);
        expect(isPublicRoute('/docs', 'GET')).toBe(true);
        expect(isPublicRoute('/api/twitch/dashboard', 'GET')).toBe(true);
    });

    it('no trata endpoints de datos del dashboard como públicos', () => {
        expect(isPublicRoute('/api/twitch/dashboard/analytics', 'GET')).toBe(false);
    });

    it('no trata comandos bot como públicos', () => {
        expect(isPublicRoute('/api/twitch/followage', 'GET')).toBe(false);
    });

    it('trata EventSub webhook como público (POST)', () => {
        expect(isPublicRoute('/api/webhooks/twitch/eventsub', 'POST')).toBe(true);
        expect(isPublicRoute('/webhooks/twitch/eventsub', 'POST')).toBe(true);
        expect(isPublicRoute('/api/webhooks/twitch/eventsub', 'GET')).toBe(false);
    });

    it('trata /about como público', () => {
        expect(isPublicRoute('/about', 'GET')).toBe(true);
        expect(isPublicRoute('/api/twitch/about', 'GET')).toBe(true);
    });

    it('no trata paths arbitrarios con callback como públicos', () => {
        expect(isPublicRoute('/api/dashboard/evil/callback', 'GET')).toBe(false);
        expect(isPublicRoute('/api/auth/twitch/callback', 'GET')).toBe(true);
        expect(isPublicRoute('/api/auth/discord/callback', 'GET')).toBe(true);
    });
});

describe('isBotCommand', () => {
    it('incluye followage, watchtime y minijuegos', () => {
        expect(isBotCommand('/api/watchtime')).toBe(true);
        expect(isBotCommand('/watchtime')).toBe(true);
        expect(isBotCommand('/api/followage')).toBe(true);
        expect(isBotCommand('/api/minigames/slots')).toBe(true);
        expect(isBotCommand('/api/dashboard/analytics')).toBe(false);
    });
});

describe('isJsonApiRoute', () => {
    it('excluye comandos de bot (texto plano)', () => {
        expect(isJsonApiRoute('/api/watchtime')).toBe(false);
        expect(isJsonApiRoute('/api/followage')).toBe(false);
    });
});

describe('isPublicHtmlRoute', () => {
    it('incluye landing y docs', () => {
        expect(isPublicHtmlRoute('/', 'GET')).toBe(true);
        expect(isPublicHtmlRoute('/docs', 'GET')).toBe(true);
    });

    it('excluye assets y health', () => {
        expect(isPublicHtmlRoute('/img/logo.svg', 'GET')).toBe(false);
        expect(isPublicHtmlRoute('/health', 'GET')).toBe(false);
        expect(isPublicHtmlRoute('/api/twitch/health', 'GET')).toBe(false);
    });

    it('no aplica el límite de HTML al webhook EventSub', () => {
        expect(isPublicHtmlRoute('/webhooks/twitch/eventsub', 'POST')).toBe(false);
        expect(isPublicHtmlRoute('/api/webhooks/twitch/eventsub', 'POST')).toBe(false);
    });
});
