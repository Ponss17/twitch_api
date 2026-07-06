import { readScopedPref, removeScopedPref, writeScopedPref } from '@/core/session/localPrefs';

/** Polling del panel de Inicio con Realtime activo. */
export const DASHBOARD_POLL_MS = 90_000;

/** Polling de Inicio cuando Realtime no está conectado (fallback). */
export const DASHBOARD_FALLBACK_POLL_MS = 8_000;

/** Polling del Perfil — rol/seguidores cambian poco; menos carga en Vercel. */
export const PROFILE_POLL_MS = 60_000;

/** Pref unificado entre Inicio (panel) y Perfil. */
const PANEL_SYNC_PREF = 'panel_last_sync';
const LEGACY_PANEL_SYNC_KEY = 'panel_last_sync';
const LEGACY_DASHBOARD_SYNC_KEY = 'dashboard_last_sync';
const LEGACY_PROFILE_SYNC_KEY = 'profile_last_sync';

const HOME_DATA_RESET_EVENT = 'dashboard:home-data-reset';
const HOME_DATA_RESET_CHANNEL = 'dashboard_home_data_reset';
const HOME_RESET_PENDING_PREF = 'home_data_reset_pending';

function markHomeDataResetPending(userId: string): void {
    writeScopedPref(HOME_RESET_PENDING_PREF, userId, String(Date.now()));
}

export function consumeHomeDataResetPending(userId: string | undefined): boolean {
    if (!userId || !readScopedPref(HOME_RESET_PENDING_PREF, userId)) return false;
    removeScopedPref(HOME_RESET_PENDING_PREF, userId);
    return true;
}

export function readPanelSyncPref(userId: string | undefined): string | null {
    const unified = readScopedPref(PANEL_SYNC_PREF, userId, LEGACY_PANEL_SYNC_KEY);
    if (unified) return unified;

    const fromHome = readScopedPref('dashboard_last_sync', userId, LEGACY_DASHBOARD_SYNC_KEY);
    const fromProfile = readScopedPref('profile_last_sync', userId, LEGACY_PROFILE_SYNC_KEY);
    if (!fromHome && !fromProfile) return null;

    const homeTs = parseInt(fromHome ?? '0', 10);
    const profileTs = parseInt(fromProfile ?? '0', 10);
    const best = String(Math.max(homeTs, profileTs));
    writePanelSyncPref(userId, best);
    return best;
}

export function writePanelSyncPref(userId: string | undefined, value: string): void {
    writeScopedPref(PANEL_SYNC_PREF, userId, value, LEGACY_PANEL_SYNC_KEY);
}

export function clearDashboardSyncPrefs(userId: string | undefined): void {
    removeScopedPref(PANEL_SYNC_PREF, userId, LEGACY_PANEL_SYNC_KEY);
    removeScopedPref('dashboard_last_sync', userId, LEGACY_DASHBOARD_SYNC_KEY);
    removeScopedPref('profile_last_sync', userId, LEGACY_PROFILE_SYNC_KEY);
}

/** Perfil → Inicio: stats/actividad reiniciadas (p. ej. zona de peligro u otra pestaña en Inicio). */
export function broadcastHomeDataReset(userId: string): void {
    if (typeof window === 'undefined') return;

    markHomeDataResetPending(userId);
    window.dispatchEvent(new CustomEvent(HOME_DATA_RESET_EVENT, { detail: { userId } }));

    try {
        const channel = new BroadcastChannel(HOME_DATA_RESET_CHANNEL);
        channel.postMessage({ type: 'HOME_DATA_RESET', userId });
        channel.close();
    } catch {
        /* BroadcastChannel no disponible */
    }
}

/** Solo Inicio escucha esto — el Perfil ya no muestra stats. */
export function subscribeHomeDataReset(
    userId: string | undefined,
    onReset: () => void
): () => void {
    if (typeof window === 'undefined' || !userId) return () => {};

    const handle = (event: Event) => {
        const detail = (event as CustomEvent<{ userId?: string }>).detail;
        if (detail?.userId !== userId) return;
        onReset();
    };

    window.addEventListener(HOME_DATA_RESET_EVENT, handle);

    let channel: BroadcastChannel | null = null;
    try {
        channel = new BroadcastChannel(HOME_DATA_RESET_CHANNEL);
        channel.onmessage = (msg) => {
            if (msg.data?.userId !== userId) return;
            if (msg.data?.type === 'HOME_DATA_RESET') onReset();
        };
    } catch {
        /* ignore */
    }

    return () => {
        window.removeEventListener(HOME_DATA_RESET_EVENT, handle);
        channel?.close();
    };
}
