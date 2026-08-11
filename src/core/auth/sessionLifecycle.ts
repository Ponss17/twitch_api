import { bindCommandStoreUser } from '@/features/commands/lib/commandStore';
import { clearDashboardSplashFlags } from '@/core/session/splashFlags';
import { appPath } from '@/core/config/paths';
import { getSession, removeSessionStorage } from './sessionStorage';
import { clearValidateCache } from './validateCache';
import { clearRevealedApiKeyCache } from './revealApiKey';
import { clearSessionAuthGrace } from './sessionAuthGrace';

const AUTH_SYNC_CHANNEL = 'auth_sync_channel';
const INTENTIONAL_LOGOUT_KEY = 'lp_auth_intentional_logout';

let authChannel: BroadcastChannel | null = null;

/** Marca un cierre de sesión voluntario (evita toast de “sesión expirada”). */
export function markIntentionalLogout(): void {
    try {
        sessionStorage.setItem(INTENTIONAL_LOGOUT_KEY, '1');
    } catch {
        /* private mode */
    }
}

export function isIntentionalLogout(): boolean {
    try {
        return sessionStorage.getItem(INTENTIONAL_LOGOUT_KEY) === '1';
    } catch {
        return false;
    }
}

/** Consume el flag (una sola vez) tras recargar. */
export function consumeIntentionalLogout(): boolean {
    try {
        if (sessionStorage.getItem(INTENTIONAL_LOGOUT_KEY) !== '1') return false;
        sessionStorage.removeItem(INTENTIONAL_LOGOUT_KEY);
        return true;
    } catch {
        return false;
    }
}

function broadcastLogout(): void {
    try {
        const payload = { type: 'LOGOUT', intentional: true };
        if (authChannel) {
            authChannel.postMessage(payload);
        } else {
            const tempChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
            tempChannel.postMessage(payload);
            tempChannel.close();
        }
    } catch {
        /* BroadcastChannel no disponible */
    }
}

function clearSession(): void {
    const previous = getSession();
    bindCommandStoreUser(undefined);
    removeSessionStorage();
    clearRevealedApiKeyCache();
    clearSessionAuthGrace();
    if (typeof window !== 'undefined') {
        clearValidateCache(previous);
        clearDashboardSplashFlags();
    }
}

/** Punto único para cerrar sesión local (opcionalmente avisar a otras pestañas). */
export function invalidateSession(options?: { broadcast?: boolean }): void {
    clearSession();

    if (options?.broadcast === false || typeof window === 'undefined') return;

    broadcastLogout();
}

export function initAuthSync(): void {
    if (typeof window === 'undefined' || authChannel) return;

    authChannel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    authChannel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
            if (event.data?.intentional) markIntentionalLogout();
            invalidateSession({ broadcast: false });
            window.location.href = appPath('/');
        }
    };
}
