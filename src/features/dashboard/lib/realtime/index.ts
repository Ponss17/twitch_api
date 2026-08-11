import type { Session } from '@/core/config/config';
import type { ActivityLogItem } from '../activityLogDisplay';
import type { RealtimeStatsUpdate } from '../dashboardStats';
import { RealtimeService } from './RealtimeService';
import type { RealtimeCallbacks, RealtimeSubscribeOptions, SubscriberEntry } from './types';
import { isRealtimeInCooldown, markRealtimeCooldown } from './cooldown';
import { waitForStablePage, isPageUnloading } from './errors';

export { isRealtimeInCooldown } from './cooldown';
export type { RealtimeCallbacks } from './types';
export { RealtimeService }; // For any other imports

let realtimeServiceInstance: RealtimeService | null = null;
let activeSessionKey: string | null = null;
const subscribers = new Map<string, SubscriberEntry>();
let connectInFlight: Promise<boolean> | null = null;
let destroyTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

const MAX_RECONNECT_ATTEMPTS = 6;
const RECONNECT_BASE_MS = 1200;

function sessionKey(session: Session): string {
    return session.userId ?? '';
}

function getActiveSubscriberSession(): Session | null {
    return subscribers.values().next().value?.session ?? null;
}

function resetReconnectState(): void {
    reconnectAttempts = 0;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleReconnect(reason: 'benign' | 'error' | 'failed'): void {
    if (typeof window === 'undefined' || isPageUnloading()) return;
    if (subscribers.size === 0) return;
    if (isRealtimeInCooldown()) return;
    if (reconnectTimer) return;

    if (reason === 'error' || reason === 'failed') {
        notifyConnection(false);
    }

    const attempt = reconnectAttempts;
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        markRealtimeCooldown();
        notifyDisconnect();
        resetReconnectState();
        return;
    }

    reconnectAttempts += 1;
    const delay = reason === 'benign' ? 400 : Math.min(RECONNECT_BASE_MS * 1.4 ** attempt, 12_000);

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        const session = getActiveSubscriberSession();
        if (!session || subscribers.size === 0) return;
        void ensureConnected(session);
    }, delay);
}

function hasActiveSubscribers(): boolean {
    return subscribers.size > 0;
}

function cancelPendingDestroy(): void {
    if (destroyTimer) {
        clearTimeout(destroyTimer);
        destroyTimer = null;
    }
}

function scheduleDestroyIfIdle(): void {
    cancelPendingDestroy();
    destroyTimer = setTimeout(() => {
        destroyTimer = null;
        if (subscribers.size === 0) {
            RealtimeServiceFactory.destroy();
        }
    }, 400);
}

function dispatchToSubscribers(
    kind: 'stats' | 'activity',
    payload: RealtimeStatsUpdate | ActivityLogItem
): void {
    for (const entry of subscribers.values()) {
        if (kind === 'stats') {
            entry.callbacks.onStatsUpdate(payload as RealtimeStatsUpdate);
        } else {
            entry.callbacks.onActivityInsert(payload as ActivityLogItem);
        }
    }
}

function notifyConnection(connected: boolean): void {
    if (connected) resetReconnectState();
    for (const entry of subscribers.values()) {
        entry.options.onConnectionChange?.(connected);
    }
}

function notifyDisconnect(): void {
    for (const entry of subscribers.values()) {
        entry.options.onDisconnect?.();
    }
}

function ensureService(session: Session): RealtimeService {
    const key = sessionKey(session);
    if (!realtimeServiceInstance || activeSessionKey !== key) {
        realtimeServiceInstance?.disconnect();
        realtimeServiceInstance = new RealtimeService(session, scheduleReconnect, hasActiveSubscribers);
        activeSessionKey = key;
        connectInFlight = null;
    }

    realtimeServiceInstance.setDispatchers(
        (stats) => dispatchToSubscribers('stats', stats),
        (log) => dispatchToSubscribers('activity', log)
    );

    return realtimeServiceInstance;
}

async function ensureConnected(session: Session): Promise<boolean> {
    await waitForStablePage();
    if (subscribers.size === 0) return false;

    const service = ensureService(session);
    service.setTimezone(subscribers.values().next().value?.options.timezone);
    if (service.connected) return true;
    if (connectInFlight) return connectInFlight;

    connectInFlight = service
        .connect(
            () => notifyDisconnect(),
            (connected) => notifyConnection(connected)
        )
        .then((ok) => {
            if (!ok && subscribers.size > 0) {
                scheduleReconnect('failed');
            }
            return ok;
        })
        .finally(() => {
            connectInFlight = null;
        });

    return connectInFlight;
}

export const RealtimeServiceFactory = {
    subscribe(
        id: string,
        session: Session,
        callbacks: RealtimeCallbacks,
        options: RealtimeSubscribeOptions = {}
    ): () => void {
        cancelPendingDestroy();
        subscribers.set(id, { session, callbacks, options });
        void ensureConnected(session);
        if (realtimeServiceInstance?.connected) {
            options.onConnectionChange?.(true);
        }
        return () => {
            subscribers.delete(id);
            if (subscribers.size === 0) {
                scheduleDestroyIfIdle();
            }
        };
    },

    isConnected(): boolean {
        return realtimeServiceInstance?.connected ?? false;
    },

    destroy(): void {
        cancelPendingDestroy();
        resetReconnectState();
        subscribers.clear();
        connectInFlight = null;
        activeSessionKey = null;
        if (realtimeServiceInstance) {
            realtimeServiceInstance.disconnect();
            realtimeServiceInstance = null;
        }
    }
};
