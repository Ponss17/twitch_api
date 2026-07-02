import { API_ENDPOINTS, type ApiResponse, type Session } from '@/core/config/config';
import { parseHttpErrorBody } from './apiError';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { bindCommandStoreUser } from '@/features/commands/lib/commandStore';
import { sessionFingerprint } from '@/core/session/localPrefs';

const SESSION_KEY = 'twitch_api_session';
const VALIDATE_CACHE_BASE = 'twitch_validate_cache';
const LEGACY_VALIDATE_CACHE_KEY = 'twitch_validate_cache';
/** Revalidación en servidor; caché en localStorage para sobrevivir cierres de pestaña */
const VALIDATE_TTL_MS = 4 * 60 * 60 * 1000;
/** Tras OAuth / login nuevo — splash con barra de progreso en el dashboard */
const DASHBOARD_SPLASH_KEY = 'dashboard_splash';
const DASHBOARD_SPLASH_FRESH_KEY = 'dashboard_splash_fresh';
const AUTH_SYNC_CHANNEL = 'auth_sync_channel';

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

let authChannel: BroadcastChannel | null = null;

function validateCacheKey(session: Session): string {
    return `${VALIDATE_CACHE_BASE}_${sessionFingerprint(session)}`;
}

function clearValidateCache(session?: Session | null): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LEGACY_VALIDATE_CACHE_KEY);
    if (session) {
        localStorage.removeItem(validateCacheKey(session));
    }
}

export function initAuthSync(): void {
    if (typeof window === 'undefined' || authChannel) return;

    authChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    authChannel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
            invalidateSession({ broadcast: false });
            window.location.href = window.location.origin + window.location.pathname;
        }
    };
}

export function getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
}

export function saveSession(session: Session): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
    const previous = getSession();
    bindCommandStoreUser(undefined);
    localStorage.removeItem(SESSION_KEY);
    if (typeof window !== 'undefined') {
        clearValidateCache(previous);
        clearDashboardSplashFlags();
    }
}

/** Punto único para cerrar sesión local (opcionalmente avisar a otras pestañas). */
export function invalidateSession(options?: { broadcast?: boolean }): void {
    clearSession();

    if (options?.broadcast === false || typeof window === 'undefined') return;

    try {
        if (authChannel) {
            authChannel.postMessage({ type: 'LOGOUT' });
        } else {
            const tempChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
            tempChannel.postMessage({ type: 'LOGOUT' });
            tempChannel.close();
        }
    } catch {
        /* BroadcastChannel no disponible */
    }
}

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

/** Elimina credenciales y datos de perfil de la URL tras OAuth. */
export function stripSensitiveQueryParams(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    let changed = false;

    for (const key of SENSITIVE_QUERY_PARAMS) {
        if (url.searchParams.has(key)) {
            url.searchParams.delete(key);
            changed = true;
        }
    }

    if (!changed) return;

    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, next);
}

export interface AuthHeaderOptions {
    /** Solo overlay OBS: usar x-api-key como los comandos de bot. */
    preferApiKey?: boolean;
}

export function authHeaders(
    session: Session | null,
    options: AuthHeaderOptions = {}
): Record<string, string> {
    const headers: Record<string, string> = {};
    const { preferApiKey = false } = options;

    if (preferApiKey && session?.apiKey) {
        headers['x-api-key'] = session.apiKey;
        return headers;
    }

    // Panel OAuth: priorizar token de Twitch; la API key es para bots/scripts.
    if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
    } else if (session?.apiKey) {
        headers['x-api-key'] = session.apiKey;
    }
    return headers;
}

function pickSessionFromValidate(result: ApiResponse): Partial<Session> {
    const partial: Partial<Session> = {};
    if (typeof result.apiKey === 'string' && result.apiKey) {
        partial.apiKey = result.apiKey;
    }
    if (typeof result.overlayToken === 'string' && result.overlayToken) {
        partial.overlayToken = result.overlayToken;
    }
    if (typeof result.login === 'string' && result.login) {
        partial.login = result.login;
    }
    if (typeof result.displayName === 'string' && result.displayName) {
        partial.displayName = result.displayName;
    }
    if (typeof result.userId === 'string' && result.userId) {
        partial.userId = result.userId;
    }
    if (typeof result.profile_image_url === 'string' && result.profile_image_url) {
        partial.profile_image_url = result.profile_image_url;
    }
    const user = result.user;
    if (user && typeof user === 'object') {
        const profile = user as Record<string, unknown>;
        if (typeof profile.login === 'string') partial.login = profile.login;
        if (typeof profile.display_name === 'string') partial.displayName = profile.display_name;
        if (typeof profile.profile_image_url === 'string') {
            partial.profile_image_url = profile.profile_image_url;
        }
        if (typeof profile.id === 'string') partial.userId = profile.id;
    }
    return partial;
}

export function mergeSessionFromValidate(
    session: Session,
    result: ApiResponse,
    options?: { persist?: boolean }
): Session {
    const merged: Session = { ...session, ...pickSessionFromValidate(result) };
    if (options?.persist !== false) {
        saveSession(merged);
    }
    return merged;
}

function canUseDegradedSession(session: Session): boolean {
    if (session.apiKey || session.token || session.overlayToken) return true;
    const stored = getSession();
    return !!(stored?.apiKey || stored?.token || stored?.overlayToken);
}

function resolveDegradedSession(session: Session): Session {
    const stored = getSession();
    return stored ? { ...stored, ...session } : session;
}

/** Sesión en localStorage sin OAuth en curso — mostrar panel al instante. */
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
        return { session: stored, loading: false, authenticated: true };
    }
    return { session: null, loading: true, authenticated: false };
}

export async function validateSession(session: Session): Promise<ApiResponse> {
    if (session.overlayToken) {
        return validateOverlaySession(session);
    }

    if (!session.apiKey && !session.token) {
        return { valid: false, error: true, message: 'no_credentials' };
    }

    if (typeof window !== 'undefined') {
        try {
            const cacheKey = validateCacheKey(session);
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                const cached = JSON.parse(raw) as { at: number; result: ApiResponse };
                if (Date.now() - cached.at < VALIDATE_TTL_MS && cached.result.valid === true) {
                    reportSessionLoadProgress({
                        progress: 48,
                        label: 'Sesión validada (caché local)',
                        cached: true
                    });
                    return cached.result;
                }
            }
        } catch {
            clearValidateCache(session);
        }
    }

    reportSessionLoadProgress({
        progress: 28,
        label: 'Validando con Twitch…',
        cached: false
    });

    let driftProgress = 28;
    const driftTimer =
        typeof window !== 'undefined'
            ? window.setInterval(() => {
                  driftProgress = Math.min(driftProgress + 1, 46);
                  reportSessionLoadProgress({
                      progress: driftProgress,
                      label: 'Despertando servidor (sin caché)…',
                      cached: false
                  });
              }, 450)
            : null;

    const attempt = async (credentials: Session) => {
        try {
            const response = await fetch(API_ENDPOINTS.VALIDATE, {
                headers: authHeaders(credentials)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return { valid: false, error: true, message: 'unauthorized' as const, networkError: false };
                }
                return {
                    valid: false,
                    error: true,
                    message: `HTTP ${response.status}`,
                    networkError: true
                };
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = (await response.json()) as ApiResponse;
                return data.valid
                    ? { ...data, networkError: false }
                    : { valid: false, error: true, networkError: false };
            }

            return { valid: true, networkError: false };
        } catch {
            return { valid: false, error: true, message: 'network_error', networkError: true };
        }
    };

    try {
        let result: ApiResponse & { networkError?: boolean };

        if (session.apiKey) {
            result = await attempt({
                apiKey: session.apiKey,
                login: session.login,
                userId: session.userId
            });
            if (result.valid !== true && !result.networkError && session.token) {
                result = await attempt(session);
            }
        } else {
            result = await attempt(session);
        }

        reportSessionLoadProgress({
            progress: 52,
            label: result.valid === true ? 'Sesión verificada' : 'Comprobando credenciales…',
            cached: false
        });

        if (result.valid === true) {
            saveSession({ ...session, ...pickSessionFromValidate(result) });
        }

        if (result.valid !== true && result.networkError) {
            if (canUseDegradedSession(session)) {
                return {
                    valid: true,
                    error: true,
                    message: result.message,
                    networkError: true
                };
            }
            return { valid: false, error: true, message: result.message ?? 'network_error' };
        }

        if (result.valid === true && !result.error && typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    validateCacheKey(session),
                    JSON.stringify({ at: Date.now(), result })
                );
                localStorage.removeItem(LEGACY_VALIDATE_CACHE_KEY);
            } catch {
                /* quota exceeded */
            }
        } else if (!result.networkError && typeof window !== 'undefined') {
            clearValidateCache(session);
        }

        return result;
    } finally {
        if (driftTimer) window.clearInterval(driftTimer);
    }
}

export async function validateOverlaySession(session: Session): Promise<ApiResponse> {
    if (!session.overlayToken) {
        return { valid: false, error: true, message: 'no_credentials' };
    }

    try {
        const response = await fetch(
            `${API_ENDPOINTS.OVERLAY_EXCHANGE}?overlayToken=${encodeURIComponent(session.overlayToken)}`
        );

        if (!response.ok) {
            return {
                valid: false,
                error: true,
                message: response.status === 401 ? 'unauthorized' : `HTTP ${response.status}`
            };
        }

        const data = (await response.json()) as ApiResponse;
        return { valid: true, ...data };
    } catch {
        return { valid: false, error: true, message: 'network_error', networkError: true };
    }
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

export async function apiFetch<T>(
    url: string,
    session: Session | null,
    init: RequestInit = {}
): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            ...authHeaders(session),
            ...(init.headers as Record<string, string> | undefined)
        }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(parseHttpErrorBody(text, `HTTP ${response.status}`));
    }

    return (await response.json()) as T;
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

export { resolveDegradedSession };
