import type { DashboardTab } from './config';
import { appPath } from './paths';

const VALID_TABS: ReadonlySet<DashboardTab> = new Set([
    'home',
    'followage',
    'clips',
    'shoutout',
    'trends',
    'stalker',
    'magic8',
    'roulette',
    'russian',
    'duel',
    'profile',
    'feedback'
]);

const LAST_TAB_KEY = 'twitch_dashboard_last_tab';

export function isDashboardTab(value: string | null | undefined): value is DashboardTab {
    return value != null && value !== '' && VALID_TABS.has(value as DashboardTab);
}

/** Base path del dashboard SPA, p. ej. `/api/twitch/dashboard` */
export function getDashboardBasePath(): string {
    return appPath('/dashboard').replace(/\/$/, '');
}

export function isBareDashboardPath(pathname: string): boolean {
    const base = getDashboardBasePath();
    return pathname === base || pathname === `${base}/`;
}

/** Lee la pestaña desde el segmento de path (`/dashboard/followage`). */
export function parseTabFromPathname(pathname: string): DashboardTab | null {
    const base = getDashboardBasePath();
    if (isBareDashboardPath(pathname)) return 'home';

    const prefix = `${base}/`;
    if (!pathname.startsWith(prefix)) return null;

    const segment = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
    if (!segment) return 'home';

    return isDashboardTab(segment) ? segment : null;
}

function getSavedTab(): DashboardTab | null {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(LAST_TAB_KEY);
        return isDashboardTab(saved) ? saved : null;
    } catch {
        return null;
    }
}

function saveLastTab(tab: DashboardTab): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LAST_TAB_KEY, tab);
    } catch {
        /* quota exceeded */
    }
}

/**
 * Resuelve la pestaña activa: path > hash legacy > ?tab= > última visitada (solo en /dashboard).
 */
export function resolveDashboardTab(
    search = typeof window !== 'undefined' ? window.location.search : '',
    hash = typeof window !== 'undefined' ? window.location.hash : '',
    pathname = typeof window !== 'undefined' ? window.location.pathname : ''
): DashboardTab {
    const fromPath = parseTabFromPathname(pathname);
    if (fromPath !== null && !isBareDashboardPath(pathname)) {
        return fromPath;
    }

    const fromHash = hash.replace(/^#/, '');
    if (isDashboardTab(fromHash)) return fromHash;

    const fromQuery = new URLSearchParams(search).get('tab');
    if (isDashboardTab(fromQuery)) return fromQuery;

    if (fromPath === 'home' && isBareDashboardPath(pathname)) {
        const saved = getSavedTab();
        if (saved && saved !== 'home') return saved;
    }

    return 'home';
}

/** Sincroniza la pestaña en la URL (`/dashboard/followage`) y guarda la última visitada. */
export function setTabInUrl(tab: DashboardTab, options?: { replace?: boolean }): void {
    if (typeof window === 'undefined') return;

    saveLastTab(tab);

    const url = new URL(window.location.href);
    const base = getDashboardBasePath();
    url.pathname = tab === 'home' ? base : `${base}/${tab}`;
    url.hash = '';
    url.searchParams.delete('tab');

    const next = `${url.pathname}${url.search}`;
    const current = `${window.location.pathname}${window.location.search}`;

    if (current !== next) {
        const write = options?.replace ? history.replaceState.bind(history) : history.pushState.bind(history);
        write({}, '', next);
    }
}
