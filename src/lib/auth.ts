import { API_ENDPOINTS, type ApiResponse, type Session } from './config';

const SESSION_KEY = 'twitch_api_session';
const VALIDATE_CACHE_KEY = 'twitch_validate_cache';
const VALIDATE_TTL_MS = 5 * 60 * 1000;
const AUTH_SYNC_CHANNEL = 'auth_sync_channel';

let authChannel: BroadcastChannel | null = null;

export function initAuthSync(): void {
    if (typeof window === 'undefined' || authChannel) return;

    authChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    authChannel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
            clearSession();
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
    localStorage.removeItem(SESSION_KEY);
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(VALIDATE_CACHE_KEY);
    }
}

export function authHeaders(session: Session | null): Record<string, string> {
    const headers: Record<string, string> = {};
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;
    if (session?.apiKey) headers['x-api-key'] = session.apiKey;
    return headers;
}

export async function validateSession(session: Session): Promise<ApiResponse> {
    if (!session.apiKey && !session.token) {
        return { valid: false, error: true, message: 'no_credentials' };
    }

    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(VALIDATE_CACHE_KEY);
            if (raw) {
                const cached = JSON.parse(raw) as { at: number; result: ApiResponse };
                if (Date.now() - cached.at < VALIDATE_TTL_MS && cached.result.valid === true) {
                    return cached.result;
                }
            }
        } catch {
            sessionStorage.removeItem(VALIDATE_CACHE_KEY);
        }
    }

    const attempt = async (credentials: Session) => {
        try {
            const response = await fetch(API_ENDPOINTS.VALIDATE, {
                headers: authHeaders(credentials)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return { valid: false, error: true, message: 'unauthorized' as const };
                }
                return {
                    valid: false,
                    error: true,
                    message: `HTTP ${response.status}`
                };
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = (await response.json()) as ApiResponse;
                return data.valid ? data : { valid: false, error: true };
            }

            return { valid: true };
        } catch {
            return { valid: true, error: true, message: 'network_error' };
        }
    };

    let result = await attempt(session);

    // El token OAuth caduca; la API Key en localStorage sigue siendo válida.
    if (result.valid !== true && session.apiKey && session.token) {
        result = await attempt({ apiKey: session.apiKey });
        if (result.valid === true) {
            saveSession({ ...session, ...pickSessionFromValidate(result) });
        }
    }

    if (result.valid === true && typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(
                VALIDATE_CACHE_KEY,
                JSON.stringify({ at: Date.now(), result })
            );
        } catch {
            /* quota exceeded — omitir caché cliente */
        }
    } else if (typeof window !== 'undefined') {
        sessionStorage.removeItem(VALIDATE_CACHE_KEY);
    }

    return result;
}

function pickSessionFromValidate(result: ApiResponse): Partial<Session> {
    const partial: Partial<Session> = {};
    if (typeof result.apiKey === 'string' && result.apiKey) {
        partial.apiKey = result.apiKey;
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

export function startTwitchLogin(): void {
    clearSession();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let redirectOrigin = window.location.origin + window.location.pathname;
    redirectOrigin = redirectOrigin.replace('://www.', '://');

    const params = new URLSearchParams({
        redirect_origin: redirectOrigin
    });
    if (tz) params.set('tz', tz);

    window.location.href = `${API_ENDPOINTS.AUTH_LOGIN}?${params.toString()}`;
}

export function logout(): void {
    clearSession();
    if (authChannel) {
        authChannel.postMessage({ type: 'LOGOUT' });
    } else {
        const tempChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        tempChannel.postMessage({ type: 'LOGOUT' });
        tempChannel.close();
    }
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
        throw new Error(text || `HTTP ${response.status}`);
    }

    return (await response.json()) as T;
}

export function parseUrlParams(): Session {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const savedSession = getSession();

    return {
        login: params.get('login') || savedSession?.login || '',
        displayName: params.get('displayName') || savedSession?.displayName || '',
        profile_image_url: savedSession?.profile_image_url || '',
        token: params.get('token') || savedSession?.token,
        apiKey: params.get('apiKey') || savedSession?.apiKey,
        userId: params.get('userId') || savedSession?.userId,
        isNewLogin: !!params.get('token') || !!params.get('apiKey')
    };
}

/** @deprecated Usar parseUrlParams() en su lugar. */
export function applyOAuthParamsFromUrl(): boolean {
    const session = parseUrlParams();
    if (!session.isNewLogin) return false;

    saveSession(session);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    return true;
}
