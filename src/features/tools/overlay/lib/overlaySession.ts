import type { Session } from '@/core/config/config';

const OVERLAY_SESSION_KEY = 'twitch_overlay_session';

export function getOverlayStoredSession(): Session | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(OVERLAY_SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
}

export function saveOverlayStoredSession(session: Session): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(OVERLAY_SESSION_KEY, JSON.stringify(session));
}

export function clearOverlayStoredSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(OVERLAY_SESSION_KEY);
}

/** Estado inicial en páginas /overlay/* — espera ?overlayToken= en la URL. */
export function readOverlayOptimisticAuthState(): {
    session: Session | null;
    loading: boolean;
    authenticated: boolean;
} {
    if (typeof window === 'undefined') {
        return { session: null, loading: true, authenticated: false };
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('overlayToken') || params.get('apiKey') || params.get('auth')) {
        return { session: null, loading: true, authenticated: false };
    }

    const stored = getOverlayStoredSession();
    if (stored?.overlayToken || stored?.apiKey || stored?.token) {
        return { session: stored, loading: false, authenticated: true };
    }

    return { session: null, loading: true, authenticated: false };
}

/**
 * Sesión OBS: ?overlayToken= firmado (solo lectura, sin API key maestra).
 * Legacy: ?apiKey= y ?auth= siguen soportados temporalmente.
 */
export async function resolveOverlaySessionFromUrl(): Promise<Session> {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const overlayToken = params.get('overlayToken')?.trim();
    if (overlayToken) {
        return {
            overlayToken,
            login: '',
            displayName: '',
            isNewLogin: true
        };
    }

    const apiKeyParam = params.get('apiKey')?.trim();
    if (apiKeyParam) {
        return {
            apiKey: apiKeyParam,
            login: '',
            displayName: '',
            isNewLogin: true
        };
    }

    const { resolveSessionFromUrl, stripSensitiveQueryParams } = await import('@/core/api/auth');
    const legacy = await resolveSessionFromUrl();
    if (legacy.isNewLogin) {
        stripSensitiveQueryParams();
    }
    return legacy;
}
