import type { DashboardTab } from './config';

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

export function isDashboardTab(value: string | null): value is DashboardTab {
    return value !== null && VALID_TABS.has(value as DashboardTab);
}

/**
 * Lee la pestaña activa desde el hash (#clips) o, en legacy, desde ?tab=clips.
 */
export function parseTabFromUrl(
    search = typeof window !== 'undefined' ? window.location.search : '',
    hash = typeof window !== 'undefined' ? window.location.hash : ''
): DashboardTab {
    const fromHash = hash.replace(/^#/, '');
    if (isDashboardTab(fromHash)) return fromHash;

    const fromQuery = new URLSearchParams(search).get('tab');
    return isDashboardTab(fromQuery) ? fromQuery : 'home';
}

/** Sincroniza la pestaña en el hash (#clips) para no ensuciar la query string. */
export function setTabInUrl(tab: DashboardTab): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.delete('tab');

    if (tab === 'home') {
        url.hash = '';
    } else {
        url.hash = tab;
    }

    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current !== next) {
        window.history.replaceState({}, '', next);
    }
}
