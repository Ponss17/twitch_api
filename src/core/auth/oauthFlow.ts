import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { getSession } from './sessionStorage';
import { invalidateSession } from './sessionLifecycle';

const SENSITIVE_QUERY_PARAMS = [
    'auth',
    'token',
    'apiKey',
    'overlayToken',
    'login',
    'displayName',
    'profile_image_url',
    'userId'
] as const;

/** Elimina credenciales y datos de perfil de la URL tras OAuth. */
export function stripSensitiveQueryParams(options?: { keepOverlayToken?: boolean }): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const onOverlayPage = url.pathname.includes('/overlay/');
    let changed = false;

    for (const key of SENSITIVE_QUERY_PARAMS) {
        // OBS recarga la fuente desde la URL — no quitar overlayToken en /overlay/*
        if (onOverlayPage && key === 'overlayToken') {
            continue;
        }
        if (options?.keepOverlayToken && key === 'overlayToken' && onOverlayPage) {
            continue;
        }
        if (url.searchParams.has(key)) {
            url.searchParams.delete(key);
            changed = true;
        }
    }

    if (!changed) return;

    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next);
}

function parseStoredSession(): Session {
    const savedSession = getSession();
    return {
        login: savedSession?.login || '',
        displayName: savedSession?.displayName || '',
        profile_image_url: savedSession?.profile_image_url || '',
        token: savedSession?.token,
        apiKey: savedSession?.apiKey,
        userId: savedSession?.userId,
        isNewLogin: false
    };
}

export async function resolveSessionFromUrl(): Promise<Session> {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth');

    if (authToken) {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.AUTH_EXCHANGE}?auth=${encodeURIComponent(authToken)}`
            );
            if (response.ok) {
                const data = (await response.json()) as Session;
                stripSensitiveQueryParams();
                return {
                    login: data.login || '',
                    displayName: data.displayName || '',
                    profile_image_url: data.profile_image_url || '',
                    token: data.token,
                    apiKey: data.apiKey,
                    userId: data.userId,
                    isNewLogin: true
                };
            }
        } catch {
            /* sin exchange válido */
        }
    }

    return parseStoredSession();
}

/** Sesión en localStorage sin OAuth en curso — esperar validate antes de montar el panel. */
export function readOptimisticAuthState(): {
    session: Session | null;
    loading: boolean;
    authenticated: boolean;
} {
    if (typeof window === 'undefined') {
        return { session: null, loading: true, authenticated: false };
    }
    if (new URLSearchParams(window.location.search).get('auth')) {
        return { session: null, loading: true, authenticated: false };
    }
    const stored = getSession();
    if (stored?.apiKey || stored?.token) {
        return { session: stored, loading: true, authenticated: false };
    }
    return { session: null, loading: true, authenticated: false };
}

export function startTwitchLogin(): void {
    invalidateSession({ broadcast: false });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const redirectOrigin = window.location.origin + window.location.pathname;

    const params = new URLSearchParams({
        redirect_origin: redirectOrigin
    });
    if (tz) params.set('tz', tz);

    window.location.href = `${API_ENDPOINTS.AUTH_LOGIN}?${params.toString()}`;
}

export function logout(): void {
    invalidateSession({ broadcast: true });
    window.location.href = window.location.origin + window.location.pathname;
}
