import {
    APP_MOUNT,
    appPath,
    docsReturnPath,
    getAppBasePath,
    normalizePanelReturnPath,
    persistPanelReturnPath,
    saveDocsReturnPath,
    shouldSavePanelReturn,
    staticPath,
    joinAppPath,
    legalPath
} from '@/core/config/paths';

describe('paths (frontend)', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('expone el mount canónico ', () => {
        expect(APP_MOUNT).toBe('');
    });

    it('getAppBasePath es estable en SSR y cliente', () => {
        expect(getAppBasePath()).toBe('');
    });

    it('appPath antepone el mount', () => {
        expect(appPath('/')).toBe('/');
        expect(appPath('/docs')).toBe('/docs');
        expect(appPath('/dashboard')).toBe('/dashboard');
    });

    it('staticPath antepone el mount a assets', () => {
        expect(staticPath('/img/logo.svg')).toBe('/img/logo.svg');
    });

    it('joinAppPath funciona con BASE_URL absoluta de Astro en producción', () => {
        expect(joinAppPath('https://www.losperris.dev', '/img/logo.svg')).toBe(
            '/img/logo.svg'
        );
        expect(joinAppPath('https://www.losperris.dev/', 'manifest.json')).toBe(
            '/manifest.json'
        );
    });

    it('docsReturnPath vuelve al dashboard guardado con pestaña', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/dashboard/russian');
        expect(docsReturnPath()).toBe('/dashboard/russian');
    });

    it('docsReturnPath usa dashboard por defecto sin origen guardado', () => {
        sessionStorage.removeItem('twitch_docs_return_path');
        expect(docsReturnPath()).toBe('/dashboard');
    });

    it('docsReturnPath normaliza barra final del dashboard (proxy losperris)', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/dashboard/');
        expect(docsReturnPath()).toBe('/dashboard');
    });

    it('normalizePanelReturnPath quita barra final en pestañas', () => {
        expect(normalizePanelReturnPath('/dashboard/clips/')).toBe('/dashboard/clips');
    });

    it('saveDocsReturnPath no guarda desde páginas secundarias', () => {
        window.history.pushState({}, '', '/sobre-la-api/');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBeNull();
    });

    it('saveDocsReturnPath guarda la ruta del dashboard al salir', () => {
        window.history.pushState({}, '', '/dashboard/clips');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/dashboard/clips');
    });

    it('saveDocsReturnPath normaliza home del dashboard sin barra final', () => {
        window.history.pushState({}, '', '/dashboard/');
        saveDocsReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/dashboard');
    });

    it('persistPanelReturnPath guarda landing y pestañas del dashboard', () => {
        window.history.pushState({}, '', '/');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/');

        window.history.pushState({}, '', '/dashboard/roulette');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/dashboard/roulette');
    });

    it('persistPanelReturnPath no guarda desde páginas secundarias', () => {
        sessionStorage.setItem('twitch_docs_return_path', '/dashboard/clips');
        window.history.pushState({}, '', '/docs');
        persistPanelReturnPath();
        expect(sessionStorage.getItem('twitch_docs_return_path')).toBe('/dashboard/clips');
    });

    it('legalPath une sección con hash', () => {
        expect(legalPath('almacenamiento')).toBe('/legal#almacenamiento');
        expect(legalPath()).toBe('/legal');
    });

    it('shouldSavePanelReturn incluye docs y sobre-la-api', () => {
        expect(shouldSavePanelReturn('/docs')).toBe(true);
        expect(shouldSavePanelReturn('/sobre-la-api')).toBe(true);
        expect(shouldSavePanelReturn('/legal')).toBe(false);
    });
});
