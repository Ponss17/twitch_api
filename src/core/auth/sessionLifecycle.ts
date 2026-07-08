import { bindCommandStoreUser } from '@/features/commands/lib/commandStore';
import { clearDashboardSplashFlags } from '@/features/dashboard/lib/splashFlags';
import { getSession, removeSessionStorage } from './sessionStorage';
import { clearValidateCache } from './validateCache';

const AUTH_SYNC_CHANNEL = 'auth_sync_channel';

let authChannel: BroadcastChannel | null = null;

function broadcastLogout(): void {
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

function clearSession(): void {
    const previous = getSession();
    bindCommandStoreUser(undefined);
    removeSessionStorage();
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
            invalidateSession({ broadcast: false });
            window.location.href = window.location.origin + window.location.pathname;
        }
    };
}
