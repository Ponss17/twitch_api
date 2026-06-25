import {
    APP_MOUNT,
    appPath,
    dashboardHomePath,
    docsReturnPath,
    getAppBasePath,
    normalizePanelReturnPath,
    persistPanelReturnPath,
    saveDocsReturnPath,
    shouldSavePanelReturn,
    staticPath,
    joinAppPath
} from '@/lib/paths';

describe('paths (frontend)', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

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

    it('docsReturnPath vuelve al dashboard guardado con pestaña', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/api/twitch/dashboard/russian');
        expect(docsReturnPath()).toBe('/api/twitch/dashboard/russian');
    });

    it('docsReturnPath usa dashboard por defecto sin origen guardado', () => {
        sessionStorage.removeItem('twitch_docs_return_path');
        expect(docsReturnPath()).toBe('/api/twitch/dashboard');
    });

    it('docsReturnPath normaliza barra final del dashboard (proxy losperris)', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/api/twitch/dashboard/');
        expect(docsReturnPath()).toBe('/api/twitch/dashboard');
    });

    it('normalizePanelReturnPath quita barra final en pestañas', () => {
        expect(normalizePanelReturnPath('/api/twitch/dashboard/clips/')).toBe('/api/twitch/dashboard/clips');
    });

    it('saveDocsReturnPath no guarda desde páginas secundarias', () => {
        window.history.pushState({}, '', '/api/twitch/sobre-la-api/');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBeNull();
    });

    it('saveDocsReturnPath guarda la ruta del dashboard al salir', () => {
        window.history.pushState({}, '', '/api/twitch/dashboard/clips');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/api/twitch/dashboard/clips');
    });

    it('saveDocsReturnPath normaliza home del dashboard sin barra final', () => {
        window.history.pushState({}, '', '/api/twitch/dashboard/');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/api/twitch/dashboard');
    });

    it('persistPanelReturnPath guarda landing y pestañas del dashboard', () => {
        window.history.pushState({}, '', '/api/twitch/');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/api/twitch/');

        window.history.pushState({}, '', '/api/twitch/dashboard/roulette');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/api/twitch/dashboard/roulette');
    });

    it('persistPanelReturnPath no guarda desde páginas secundarias', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/api/twitch/dashboard/clips');
        window.history.pushState({}, '', '/api/twitch/docs');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/api/twitch/dashboard/clips');
    });

    it('shouldSavePanelReturn incluye docs y sobre-la-api', () => {
        expect(shouldSavePanelReturn('/docs')).toBe(true);
        expect(shouldSavePanelReturn('/sobre-la-api')).toBe(true);
        expect(shouldSavePanelReturn('/privacidad')).toBe(false);
    });
});
