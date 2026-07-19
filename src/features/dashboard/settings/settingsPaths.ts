import { appPath } from '@/core/config/paths';

export type SettingsTabId = 'general' | 'seguridad' | 'conexiones';

export const SETTINGS_TAB_STORAGE_KEY = 'losperris.settings.tab';

export function isSettingsTabId(value: string | null | undefined): value is SettingsTabId {
    return value === 'general' || value === 'seguridad' || value === 'conexiones';
}

/** Base de Settings, p. ej. `/dashboard/settings` */
export function getSettingsBasePath(): string {
    return `${appPath('/dashboard').replace(/\/$/, '')}/settings`;
}

/** Path canónico: general → `/dashboard/settings`, resto → `/dashboard/settings/{tab}` */
export function settingsTabPath(tab: SettingsTabId): string {
    const base = getSettingsBasePath();
    return tab === 'general' ? base : `${base}/${tab}`;
}

/**
 * Lee la sub-pestaña desde el path.
 * Soporta legacy `?s=` mientras migramos bookmarks.
 */
export function parseSettingsTabFromLocation(
    pathname = typeof window !== 'undefined' ? window.location.pathname : '',
    search = typeof window !== 'undefined' ? window.location.search : ''
): SettingsTabId | null {
    const base = getSettingsBasePath();
    if (pathname === base || pathname === `${base}/`) {
        const legacy = new URLSearchParams(search).get('s');
        return isSettingsTabId(legacy) ? legacy : 'general';
    }
    if (!pathname.startsWith(`${base}/`)) return null;

    const segment = pathname.slice(base.length + 1).split('/').filter(Boolean)[0];
    if (!segment || segment === 'general') return 'general';
    return isSettingsTabId(segment) ? segment : null;
}

export function rememberSettingsTab(tab: SettingsTabId): void {
    try {
        sessionStorage.setItem(SETTINGS_TAB_STORAGE_KEY, tab);
    } catch {
        /* ignore */
    }
}

export function readInitialSettingsTab(): SettingsTabId {
    if (typeof window === 'undefined') return 'general';
    const params = new URLSearchParams(window.location.search);
    if (params.get('discord')) return 'conexiones';

    const fromPath = parseSettingsTabFromLocation();
    if (fromPath) return fromPath;

    try {
        const stored = sessionStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
        if (isSettingsTabId(stored)) return stored;
    } catch {
        /* ignore */
    }
    return 'general';
}

export function writeSettingsTabUrl(tab: SettingsTabId, options?: { replace?: boolean }): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.pathname = settingsTabPath(tab);
    url.searchParams.delete('s');
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current === next) return;
    const write =
        options?.replace === false
            ? history.pushState.bind(history)
            : history.replaceState.bind(history);
    write({}, '', next);
}
