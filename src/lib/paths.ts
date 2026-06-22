/** Mount canónico tras proxy de www.losperris.dev → /api/twitch/ */
export const APP_MOUNT = '/api/twitch';

export function getAppBasePath(): string {
    return APP_MOUNT;
}

/** Normaliza BASE_URL de Astro (path o URL absoluta) al mount /api/twitch. */
export function normalizeAppBase(base: string = getAppBasePath()): string {
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

export function getOrigin(): string {
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

const DOCS_RETURN_PATH_KEY = 'twitch_docs_return_path';
const DOCS_PAGE_SUFFIX = '/docs';

export function saveDocsReturnPath(): void {
    if (typeof window === 'undefined') return;
    const { pathname } = window.location;
    if (pathname.endsWith(DOCS_PAGE_SUFFIX)) return;
    sessionStorage.setItem(DOCS_RETURN_PATH_KEY, pathname);
}

export function docsReturnPath(): string {
    if (typeof window === 'undefined') return appPath('/dashboard');

    const saved = sessionStorage.getItem(DOCS_RETURN_PATH_KEY);
    if (saved && isValidDocsReturnTarget(saved)) {
        return saved;
    }

    return appPath('/dashboard');
}

function isValidDocsReturnTarget(pathname: string): boolean {
    const base = getAppBasePath();
    if (!pathname.startsWith(base)) return false;
    if (pathname === `${base}${DOCS_PAGE_SUFFIX}` || pathname === `${base}${DOCS_PAGE_SUFFIX}/`) {
        return false;
    }
    return true;
}
