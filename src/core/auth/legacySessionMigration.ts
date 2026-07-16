import { API_ENDPOINTS } from '@/core/config/config';
import { withApiCredentials } from './apiCredentials';
import { invalidateSession } from './sessionLifecycle';
import { SESSION_KEY, getSession, saveSession } from './sessionStorage';

/** Schema cookie-only (Opción 2). Bump si hay otra migración forzada. */
export const AUTH_SCHEMA_KEY = 'twitch_api_auth_schema';
export const AUTH_SCHEMA_VERSION = '2';

/** sessionStorage: aviso en landing tras forzar re-login. */
export const LEGACY_RELOGIN_FLAG = 'twitch_api_legacy_relogin';
/** sessionStorage: redirect pendiente (sobrevive si migration ya marcó schema). */
const LEGACY_RELOGIN_PENDING = 'twitch_api_legacy_relogin_pending';

function rawSessionHasSecrets(): boolean {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { apiKey?: string; token?: string };
        return Boolean(parsed.apiKey || parsed.token);
    } catch {
        return false;
    }
}

function markSchemaMigrated(): void {
    localStorage.setItem(AUTH_SCHEMA_KEY, AUTH_SCHEMA_VERSION);
}

function markNeedsRelogin(): void {
    try {
        sessionStorage.setItem(LEGACY_RELOGIN_FLAG, '1');
        sessionStorage.setItem(LEGACY_RELOGIN_PENDING, '1');
    } catch {
        /* private mode */
    }
}

/**
 * Migración one-shot del panel tras auth cookie-only.
 * - Si el LS aún tiene apiKey/token: limpia sesión local + cookie y pide re-login.
 * - Si no: reescribe LS sin secretos y marca el schema.
 * @returns true si hay que redirigir a la landing para re-login.
 */
export function runLegacyPanelSessionMigration(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        if (sessionStorage.getItem(LEGACY_RELOGIN_PENDING) === '1') {
            return true;
        }
    } catch {
        /* private mode */
    }

    const alreadyMigrated = localStorage.getItem(AUTH_SCHEMA_KEY) === AUTH_SCHEMA_VERSION;
    if (alreadyMigrated) {
        if (rawSessionHasSecrets()) {
            const session = getSession();
            if (session) saveSession(session);
        }
        return false;
    }

    if (rawSessionHasSecrets()) {
        markSchemaMigrated();
        markNeedsRelogin();
        invalidateSession({ broadcast: true });
        void fetch(API_ENDPOINTS.AUTH_LOGOUT, withApiCredentials({ method: 'POST' })).catch(() => {
            /* best-effort: limpiar lp_sess */
        });
        return true;
    }

    const session = getSession();
    if (session?.userId) {
        saveSession(session);
    }
    markSchemaMigrated();
    return false;
}

/** True si hay que ir a la landing; limpia el pending (el aviso de toast permanece). */
export function takeLegacyReloginRedirect(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (sessionStorage.getItem(LEGACY_RELOGIN_PENDING) === '1') {
            sessionStorage.removeItem(LEGACY_RELOGIN_PENDING);
            return true;
        }
    } catch {
        /* private mode */
    }
    return false;
}

/** Consume el aviso de re-login en landing (una vez). */
export function consumeLegacyReloginNotice(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (sessionStorage.getItem(LEGACY_RELOGIN_FLAG) === '1') {
            sessionStorage.removeItem(LEGACY_RELOGIN_FLAG);
            return true;
        }
    } catch {
        /* private mode */
    }
    return false;
}
