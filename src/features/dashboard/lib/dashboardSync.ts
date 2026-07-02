import { readScopedPref, removeScopedPref, writeScopedPref } from '@/core/session/localPrefs';

/** Mismo intervalo de polling en Inicio y Perfil (Resumen de Actividad). */
export const DASHBOARD_POLL_MS = 90_000;

/** Polling acelerado cuando Realtime no está conectado (fallback). */
export const DASHBOARD_FALLBACK_POLL_MS = 8_000;

/** Pref unificado — evita desfase entre Inicio y Perfil. */
export const PANEL_SYNC_PREF = 'panel_last_sync';
const LEGACY_PANEL_SYNC_KEY = 'panel_last_sync';
const LEGACY_DASHBOARD_SYNC_KEY = 'dashboard_last_sync';
const LEGACY_PROFILE_SYNC_KEY = 'profile_last_sync';

/** @deprecated Usar PANEL_SYNC_PREF */
export const DASHBOARD_SYNC_PREF = PANEL_SYNC_PREF;
/** @deprecated Usar PANEL_SYNC_PREF */
export const PROFILE_SYNC_PREF = PANEL_SYNC_PREF;

export type DashboardMutationReason = 'stats-cleared' | 'panel-refresh';

const PANEL_SYNC_CHANNEL = 'dashboard_panel_sync';

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

function postPanelMutation(userId: string, reason: DashboardMutationReason): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent('dashboard:panel-mutation', { detail: { userId, reason } })
    );

    if (reason === 'stats-cleared') {
        window.dispatchEvent(new CustomEvent('dashboard:stats-cleared', { detail: { userId } }));
    }

    try {
        const channel = new BroadcastChannel(PANEL_SYNC_CHANNEL);
        channel.postMessage({ type: 'PANEL_MUTATION', userId, reason });
        channel.close();
    } catch {
        /* BroadcastChannel no disponible */
    }
}

/** Avisa a Inicio, Perfil y otras pestañas de que las stats se reiniciaron. */
export function broadcastStatsCleared(userId: string): void {
    postPanelMutation(userId, 'stats-cleared');
}

/** Refresco general del panel (p. ej. tras regenerar API key). */
export function broadcastPanelRefresh(userId: string): void {
    postPanelMutation(userId, 'panel-refresh');
}

export function subscribeDashboardMutation(
    userId: string | undefined,
    handlers: {
        onStatsCleared?: () => void;
        onPanelRefresh?: () => void;
    }
): () => void {
    if (typeof window === 'undefined' || !userId) return () => {};

    const dispatch = (reason: DashboardMutationReason) => {
        if (reason === 'stats-cleared') handlers.onStatsCleared?.();
        else handlers.onPanelRefresh?.();
    };

    const handle = (event: Event) => {
        const detail = (event as CustomEvent<{ userId?: string; reason?: DashboardMutationReason }>)
            .detail;
        if (detail?.userId !== userId) return;
        if (event.type === 'dashboard:stats-cleared') {
            handlers.onStatsCleared?.();
            return;
        }
        if (detail?.reason) dispatch(detail.reason);
    };

    window.addEventListener('dashboard:panel-mutation', handle);
    window.addEventListener('dashboard:stats-cleared', handle);

    let channel: BroadcastChannel | null = null;
    try {
        channel = new BroadcastChannel(PANEL_SYNC_CHANNEL);
        channel.onmessage = (msg) => {
            if (msg.data?.userId !== userId) return;
            if (msg.data?.type === 'PANEL_MUTATION' && msg.data?.reason) {
                dispatch(msg.data.reason as DashboardMutationReason);
            }
            if (msg.data?.type === 'STATS_CLEARED') {
                handlers.onStatsCleared?.();
            }
        };
    } catch {
        /* ignore */
    }

    return () => {
        window.removeEventListener('dashboard:panel-mutation', handle);
        window.removeEventListener('dashboard:stats-cleared', handle);
        channel?.close();
    };
}

/** @deprecated Usar subscribeDashboardMutation */
export function subscribeStatsCleared(
    userId: string | undefined,
    onCleared: () => void
): () => void {
    return subscribeDashboardMutation(userId, { onStatsCleared: onCleared });
}
