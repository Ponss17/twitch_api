const DASHBOARD_SPLASH_KEY = 'dashboard_splash';
const DASHBOARD_SPLASH_FRESH_KEY = 'dashboard_splash_fresh';

export function markDashboardSplashForFreshLogin(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(DASHBOARD_SPLASH_KEY, '1');
    sessionStorage.setItem(DASHBOARD_SPLASH_FRESH_KEY, '1');
}

export function clearDashboardSplashFlags(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(DASHBOARD_SPLASH_KEY);
    sessionStorage.removeItem(DASHBOARD_SPLASH_FRESH_KEY);
}

/** Solo splash tras OAuth; flags viejos no bloquean al volver con sesión guardada. */
export function shouldShowDashboardSplash(): boolean {
    if (typeof window === 'undefined') return false;
    const wants = sessionStorage.getItem(DASHBOARD_SPLASH_KEY) === '1';
    const fresh = sessionStorage.getItem(DASHBOARD_SPLASH_FRESH_KEY) === '1';
    if (wants && !fresh) {
        clearDashboardSplashFlags();
        return false;
    }
    return wants && fresh;
}
