const SIDEBAR_COLLAPSED_PREF = 'dashboard_sidebar_collapsed';

export function readSidebarCollapsedPref(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_PREF) === '1';
    } catch {
        return false;
    }
}

export function writeSidebarCollapsedPref(collapsed: boolean): void {
    try {
        localStorage.setItem(SIDEBAR_COLLAPSED_PREF, collapsed ? '1' : '0');
    } catch {
        /* ignore quota / private mode */
    }
}
