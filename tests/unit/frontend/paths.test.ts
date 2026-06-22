import { APP_MOUNT, appPath, docsReturnPath, getAppBasePath, staticPath, joinAppPath } from '@/lib/paths';

describe('paths (frontend)', () => {
    it('expone el mount canónico /api/twitch', () => {
        expect(APP_MOUNT).toBe('/api/twitch');
    });

    it('getAppBasePath es estable en SSR y cliente', () => {
        expect(getAppBasePath()).toBe('/api/twitch');
    });

    it('appPath antepone el mount', () => {
        expect(appPath('/')).toBe('/api/twitch/');
        expect(appPath('/docs')).toBe('/api/twitch/docs');
        expect(appPath('/dashboard')).toBe('/api/twitch/dashboard');
    });

    it('staticPath antepone el mount a assets', () => {
        expect(staticPath('/img/logo.svg')).toBe('/api/twitch/img/logo.svg');
    });

    it('joinAppPath funciona con BASE_URL absoluta de Astro en producción', () => {
        expect(joinAppPath('https://www.losperris.dev/api/twitch', '/img/logo.svg')).toBe(
            '/api/twitch/img/logo.svg'
        );
        expect(joinAppPath('https://www.losperris.dev/api/twitch/', 'manifest.json')).toBe(
            '/api/twitch/manifest.json'
        );
    });

    it('docsReturnPath vuelve al dashboard guardado', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/api/twitch/dashboard');
        expect(docsReturnPath()).toBe('/api/twitch/dashboard');
    });

    it('docsReturnPath usa dashboard por defecto sin origen guardado', () => {
        sessionStorage.removeItem('twitch_docs_return_path');
        expect(docsReturnPath()).toBe('/api/twitch/dashboard');
    });
});
