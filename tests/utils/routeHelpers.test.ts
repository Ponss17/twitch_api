import { isPublicRoute, isPublicHtmlRoute } from '../../backend/src/core/utils/routeHelpers';

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
});
