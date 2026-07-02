import { getSession, resolveSessionFromUrl, stripSensitiveQueryParams } from '@/core/api/auth';
import type { Session } from '@/core/config/config';

/** Estado inicial en páginas /overlay/* — espera ?apiKey= o ?auth= legacy en la URL. */
export function readOverlayOptimisticAuthState(): {
    session: Session | null;
    loading: boolean;
    authenticated: boolean;
} {
    if (typeof window === 'undefined') {
        return { session: null, loading: true, authenticated: false };
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('apiKey') || params.get('auth')) {
        return { session: null, loading: true, authenticated: false };
    }

    const stored = getSession();
    if (stored?.apiKey || stored?.token) {
        return { session: stored, loading: false, authenticated: true };
    }

    return { session: null, loading: true, authenticated: false };
}

/**
 * Sesión para OBS: ?apiKey= (permanente) o ?auth= legacy (5 min).
 * El dashboard sigue usando OAuth vía resolveSessionFromUrl().
 */
export async function resolveOverlaySessionFromUrl(): Promise<Session> {
    if (typeof window === 'undefined') return {};

    const apiKeyParam = new URLSearchParams(window.location.search).get('apiKey')?.trim();
    if (apiKeyParam) {
        stripSensitiveQueryParams();
        return {
            apiKey: apiKeyParam,
            login: '',
            displayName: '',
            isNewLogin: true
        };
    }

    return resolveSessionFromUrl();
}
