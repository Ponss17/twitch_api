/** Mount canónico tras proxy de www.losperris.dev → /api/twitch/ */
export const APP_MOUNT = '/api/twitch';

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
    '/privacidad',
    '/terminos',
    '/cookies',
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

/**
 * Guarda la ruta actual antes de ir a docs, sobre-la-api, etc.
 * Solo desde dashboard/landing; no sobrescribe si ya estás en una página secundaria.
 */
export function saveDocsReturnPath(): void {
    if (typeof window === 'undefined') return;
    const { pathname } = window.location;
    if (isSecondaryPage(pathname)) return;
    sessionStorage.setItem(PANEL_RETURN_PATH_KEY, pathname);
}

/** Ruta de retorno al panel (dashboard con pestaña) o landing. */
export function docsReturnPath(): string {
    if (typeof window === 'undefined') return appPath('/dashboard/');

    const saved = sessionStorage.getItem(PANEL_RETURN_PATH_KEY);
    if (saved && isValidPanelReturnTarget(saved)) {
        return saved;
    }

    return appPath('/dashboard/');
}

/** Enlaces internos del dashboard que deben recordar el origen al salir. */
export function shouldSavePanelReturn(href: string): boolean {
    return href === '/docs' || href === '/sobre-la-api';
}
