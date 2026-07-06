/** Mount canónico en ttv.losperris.dev (raíz) */
export const APP_MOUNT = '';

export function getAppBasePath(): string {
    return APP_MOUNT;
}

/** Normaliza BASE_URL de Astro (path o URL absoluta) al mount /api/twitch. */
function normalizeAppBase(base: string = getAppBasePath()): string {
    const trimmed = base.trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const pathname = new URL(`${trimmed}/`).pathname.replace(/\/$/, '');
            return pathname || APP_MOUNT;
        } catch {
            return APP_MOUNT;
        }
    }
    if (!trimmed) return '';
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Une mount + segmento sin perder la barra (evita /api/twitchimg/...). */
export function joinAppPath(base: string, segment: string): string {
    const mount = normalizeAppBase(base);
    const normalized = segment.startsWith('/') ? segment : `/${segment}`;
    return `${mount}${normalized}`;
}

/** Ruta de página (ej. /docs → /api/twitch/docs). */
export function appPath(path: string): string {
    const segment = path.startsWith('/') ? path : `/${path}`;
    const base = getAppBasePath();
    if (segment === base || segment.startsWith(`${base}/`)) return segment;
    return segment === '/' ? `${base}/` : joinAppPath(base, segment);
}

function getOrigin(): string {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
}

export function appUrl(path: string): string {
    return `${getOrigin()}${appPath(path)}`;
}

/** Sustituye `{baseURL}` por el origen actual (solo en cliente). */
export function resolveDocsTemplate(template: string): string {
    if (typeof window === 'undefined') return template;
    return template.replace(/\{baseURL\}/g, window.location.origin);
}

export type LegalSection = 'terminos' | 'privacidad' | 'cookies';

/** Ruta única de legal; con sección opcional vía hash (#privacidad, #terminos, #cookies). */
export function legalPath(section?: LegalSection): string {
    const base = appPath('/legal');
    return section ? `${base}#${section}` : base;
}

export function staticPath(path: string): string {
    return joinAppPath(getAppBasePath(), path);
}

export function absoluteAssetUrl(path: string, origin: string): string {
    return `${origin.replace(/\/$/, '')}${staticPath(path)}`;
}

const PANEL_RETURN_PATH_KEY = 'twitch_docs_return_path';

/** Páginas secundarias: no guardar como origen ni usar como destino de retorno. */
const SECONDARY_SEGMENTS = [
    '/docs',
    '/sobre-la-api',
    '/legal',
    '/404',
    '/429',
    '/500',
    '/offline'
] as const;

function isSecondaryPage(pathname: string): boolean {
    const base = getAppBasePath();
    return SECONDARY_SEGMENTS.some((segment) => {
        const full = `${base}${segment}`;
        return pathname === full || pathname === `${full}/`;
    });
}

function isValidPanelReturnTarget(pathname: string): boolean {
    const base = getAppBasePath();
    if (!pathname.startsWith(base)) return false;
    if (isSecondaryPage(pathname)) return false;
    return true;
}

/** Ruta canónica del dashboard (home) sin barra final — el proxy de losperris.dev falla con `/dashboard/`. */
export function dashboardHomePath(): string {
    return appPath('/dashboard').replace(/\/$/, '');
}

/**
 * Normaliza rutas del panel para navegación full-page tras el proxy.
 * Quita la barra final en `/dashboard` y pestañas; deja intacta la landing `/api/twitch/`.
 */
export function normalizePanelReturnPath(pathname: string): string {
    const base = getAppBasePath();
    const dash = dashboardHomePath();
    if (pathname === `${dash}/` || pathname === dash) return dash;
    if (pathname.startsWith(`${dash}/`)) {
        const normalized = pathname.replace(/\/$/, '');
        return normalized.length >= dash.length ? normalized : dash;
    }
    if (pathname === `${base}/` || pathname === base) return `${base}/`;
    return pathname;
}

/**
 * Persiste la ruta del panel (dashboard con pestaña o landing) para retorno desde docs/sobre-la-api.
 * No escribe si la URL actual es una página secundaria.
 */
export function persistPanelReturnPath(): void {
    if (typeof window === 'undefined') return;
    const { pathname } = window.location;
    if (!isValidPanelReturnTarget(pathname)) return;
    sessionStorage.setItem(PANEL_RETURN_PATH_KEY, normalizePanelReturnPath(pathname));
}

/** Guarda el origen al hacer clic en un enlace hacia docs, sobre-la-api, etc. */
export function saveDocsReturnPath(): void {
    persistPanelReturnPath();
}

/** Ruta de retorno al panel (dashboard con pestaña) o landing. */
export function docsReturnPath(): string {
    if (typeof window === 'undefined') return dashboardHomePath();

    const saved = sessionStorage.getItem(PANEL_RETURN_PATH_KEY);
    if (saved && isValidPanelReturnTarget(saved)) {
        return normalizePanelReturnPath(saved);
    }

    return dashboardHomePath();
}

/** Enlaces internos del dashboard que deben recordar el origen al salir. */
export function shouldSavePanelReturn(href: string): boolean {
    return href === '/docs' || href === '/sobre-la-api';
}
