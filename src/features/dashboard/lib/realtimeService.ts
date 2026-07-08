import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { API_ENDPOINTS, SUPABASE_ANON_KEY, SUPABASE_URL, type Session } from '@/core/config/config';
import type { ActivityLogItem } from './activityLogDisplay';
import {
    parseDashboardStatsFromRow,
    type DashboardLiveStats,
    type DailyStatsRealtimePatch,
    type RealtimeStatsUpdate
} from './dashboardStats';
import { authHeaders } from '@/core/api/auth';
import { logError } from '@/core/logging/logError';
import { debugWarn } from '@/core/logging/debugLog';

const REALTIME_COOLDOWN_SESSION_KEY = 'realtime_cooldown_until';
const REALTIME_COOLDOWN_MS = 5 * 60 * 1000;

let pageIsUnloading = false;
let unloadGuardInstalled = false;
let realtimeCooldownUntil = 0;

/** Un solo cliente Supabase por pestaña (evita GoTrueClient duplicados). */
let sharedSupabaseClient: SupabaseClient | null = null;
let sharedClientInit: Promise<SupabaseClient | null> | null = null;

/** Evita que GoTrue toque localStorage (solo usamos Realtime + JWT propio). */
const noopAuthStorage = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => undefined,
    removeItem: (_key: string) => undefined
};

async function getSharedSupabaseClient(): Promise<SupabaseClient | null> {
    if (sharedSupabaseClient) return sharedSupabaseClient;
    if (sharedClientInit) return sharedClientInit;

    sharedClientInit = (async () => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logError('Realtime', 'Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env');
            return null;
        }
        try {
            const { createClient } = await import('@supabase/supabase-js');
            sharedSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storage: noopAuthStorage,
                    storageKey: 'losperris-dashboard-realtime'
                },
                realtime: {
                    params: { apikey: SUPABASE_ANON_KEY }
                }
            });
            return sharedSupabaseClient;
        } catch {
            return null;
        } finally {
            sharedClientInit = null;
        }
    })();

    return sharedClientInit;
}

if (typeof window !== 'undefined') {
    try {
        const stored = sessionStorage.getItem(REALTIME_COOLDOWN_SESSION_KEY);
        if (stored) {
            const until = parseInt(stored, 10);
            if (!Number.isNaN(until) && until > Date.now()) {
                realtimeCooldownUntil = until;
            } else {
                sessionStorage.removeItem(REALTIME_COOLDOWN_SESSION_KEY);
            }
        }
    } catch {
        /* ignore */
    }
}

export function isRealtimeInCooldown(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const stored = sessionStorage.getItem(REALTIME_COOLDOWN_SESSION_KEY);
            if (stored) {
                const until = parseInt(stored, 10);
                if (!Number.isNaN(until)) {
                    realtimeCooldownUntil = Math.max(realtimeCooldownUntil, until);
                }
            }
        } catch {
            /* ignore */
        }
    }
    return Date.now() < realtimeCooldownUntil;
}

function markRealtimeCooldown(): void {
    realtimeCooldownUntil = Date.now() + REALTIME_COOLDOWN_MS;
    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(REALTIME_COOLDOWN_SESSION_KEY, String(realtimeCooldownUntil));
        } catch {
            /* ignore */
        }
    }
}

function isTransportFailure(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return /transport failure|connection refused|websocket|NS_ERROR_WEBSOCKET/i.test(message);
}

function installUnloadGuard(): void {
    if (unloadGuardInstalled || typeof window === 'undefined') return;
    unloadGuardInstalled = true;
    const markUnloading = () => {
        pageIsUnloading = true;
    };
    window.addEventListener('beforeunload', markUnloading);
    window.addEventListener('pagehide', markUnloading);
}

function isBenignRealtimeClose(err: unknown, intentionalClose: boolean): boolean {
    if (pageIsUnloading || intentionalClose) return true;
    if (!err) return false;

    const message = err instanceof Error ? err.message : String(err);
    if (/1000|1001|going away|socket closed/i.test(message)) return true;
    if (/interrupted|page load|NS_ERROR|network/i.test(message)) return true;

    const cause = err instanceof Error ? (err as Error & { cause?: { code?: number } }).cause : undefined;
    if (cause && typeof cause === 'object' && typeof cause.code === 'number') {
        return cause.code === 1000 || cause.code === 1001;
    }

    return false;
}

function waitForStablePage(): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();
    if (document.readyState === 'complete') {
        return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    return new Promise((resolve) => {
        window.addEventListener(
            'load',
            () => requestAnimationFrame(() => resolve()),
            { once: true }
        );
    });
}

interface RawActivityLog {
    activity_type?: string;
    user_name?: string;
    detail?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
}

export interface RealtimeCallbacks {
    onStatsUpdate: (stats: RealtimeStatsUpdate) => void;
    onActivityInsert: (log: ActivityLogItem) => void;
    /** Llamado cuando se detectan DELETEs en activity_logs (borrado masivo desde zona peligrosa). */
    onActivityDelete?: () => void;
}

interface RealtimeSubscribeOptions {
    onDisconnect?: () => void;
    onConnectionChange?: (connected: boolean) => void;
}

interface SubscriberEntry {
    session: Session;
    callbacks: RealtimeCallbacks;
    options: RealtimeSubscribeOptions;
}

function sessionKey(session: Session): string {
    return `${session.userId ?? ''}|${session.apiKey ?? ''}|${session.token ?? ''}`;
}

type ReconnectReason = 'benign' | 'error' | 'failed';
let requestRealtimeReconnect: (reason: ReconnectReason) => void = () => {};
let hasActiveSubscribers: () => boolean = () => false;

export class RealtimeService {
    private supabase: SupabaseClient | null = null;
    private channel: RealtimeChannel | null = null;
    private token: string | null = null;
    private tokenExpiry = 0;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private session: Session | null = null;
    private dispatchStats: (stats: RealtimeStatsUpdate) => void = () => {};
    private dispatchActivity: (log: ActivityLogItem) => void = () => {};
    private dispatchActivityDelete: () => void = () => {};
    private isConnected = false;
    private intentionalClose = false;
    private onDisconnectCallback: (() => void) | null = null;
    private onConnectionChange: ((connected: boolean) => void) | null = null;

    constructor(session: Session) {
        installUnloadGuard();
        this.session = session;
    }

    setDispatchers(
        onStats: (stats: RealtimeStatsUpdate) => void,
        onActivity: (log: ActivityLogItem) => void,
        onActivityDelete?: () => void
    ): void {
        this.dispatchStats = onStats;
        this.dispatchActivity = onActivity;
        this.dispatchActivityDelete = onActivityDelete ?? (() => {});
    }

    get connected(): boolean {
        return this.isConnected;
    }

    private hasValidCredentials(): boolean {
        return !!(this.session?.token || this.session?.apiKey);
    }

    private async fetchToken(): Promise<string | null> {
        if (this.token && Date.now() < this.tokenExpiry - 60_000) {
            return this.token;
        }

        if (!this.hasValidCredentials() || !this.session) return null;

        try {
            const response = await fetch(API_ENDPOINTS.REALTIME_TOKEN, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(this.session)
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
                }
                return null;
            }

            const data = (await response.json()) as {
                token?: string;
                expiresAt?: number;
                expiresIn?: number;
            };

            if (!data.token) return null;

            this.token = data.token;
            this.tokenExpiry = data.expiresAt ?? Date.now() + (data.expiresIn ?? 900) * 1000;
            return this.token;
        } catch {
            return null;
        }
    }

    private isTearingDown = false;

    private tearDownClient(): void {
        if (this.isTearingDown) return;
        this.isTearingDown = true;

        this.isConnected = false;
        this.onConnectionChange?.(false);

        const chan = this.channel;
        const supa = this.supabase;

        this.channel = null;
        this.supabase = null;

        if (chan) {
            try {
                chan.unsubscribe();
            } catch {
                /* ignore */
            }
        }

        if (supa) {
            try {
                supa.removeAllChannels();
                supa.realtime.disconnect();
            } catch {
                /* ignore */
            }
        }

        this.isTearingDown = false;
    }

    private async initializeClient(): Promise<boolean> {
        const client = await getSharedSupabaseClient();
        if (!client) return false;
        this.supabase = client;
        return true;
    }

    formatActivityLog(raw: RawActivityLog): ActivityLogItem {
        const type = raw.activity_type || 'other';
        const user = raw.user_name || 'Usuario';

        // Support both old `detail` column (pre-migration) and new `metadata` JSONB column.
        // If metadata is already a populated object from Supabase realtime, use it directly.
        // Otherwise, fall back to wrapping the legacy `detail` string so the display layer
        // can still render something useful via `raw_detail`.
        const metadata: Record<string, unknown> | undefined =
            raw.metadata && typeof raw.metadata === 'object'
                ? (raw.metadata as Record<string, unknown>)
                : raw.detail?.trim()
                  ? { raw_detail: raw.detail.trim() }
                  : undefined;

        return {
            type,
            user,
            metadata,
            timestamp: raw.created_at || new Date().toISOString()
        };
    }

    computeStats(raw: Record<string, unknown>): DashboardLiveStats {
        return parseDashboardStatsFromRow(raw);
    }

    private handleStatsRow(raw: Record<string, unknown>): void {
        this.dispatchStats(parseDashboardStatsFromRow(raw, { isPartialUpdate: true }) as DashboardLiveStats);
    }

    private async setupChannel(): Promise<boolean> {
        if (this.channel) return true;
        if (!this.supabase || !this.session?.userId) return false;

        const token = await this.fetchToken();
        if (!token) return false;

        try {
            this.channel = this.supabase.channel(`dashboard:${this.session.userId}`);

            if (this.supabase.realtime) {
                (this.supabase.realtime as { setAuth: (t: string) => void }).setAuth(token);
            }

            const userFilter = `user_id=eq.${this.session.userId}`;
            const statsHandler = (payload: { new: Record<string, unknown> }) => {
                this.handleStatsRow(payload.new);
            };

            const dailyStatsHandler = (payload: { new: Record<string, unknown> }) => {
                const row = payload.new;
                if (typeof row.command_name !== 'string' || typeof row.requests_count !== 'number') {
                    return;
                }

                const keyMap: Record<string, keyof DashboardLiveStats> = {
                    clips: 'clips',
                    followage: 'followage',
                    so: 'so',
                    message: 'message',
                    stalker: 'stalker',
                    trends: 'trends',
                    roulette: 'roulette',
                    russian: 'russian',
                    magic8: 'magic8',
                    duel: 'duel'
                };

                const patch: Partial<RealtimeStatsUpdate> = {};
                const stateKey = keyMap[row.command_name];
                if (stateKey) {
                    Object.assign(patch, { [stateKey]: row.requests_count as number });
                }

                if (typeof row.date === 'string') {
                    patch.__dailyStatsPatch = {
                        date: row.date,
                        command_name: row.command_name,
                        requests_count: Number(row.requests_count),
                        errors_count: Number(row.errors_count ?? 0),
                        latency_sum: Number(row.latency_sum ?? 0)
                    } satisfies DailyStatsRealtimePatch;
                }

                if (Object.keys(patch).length > 0) {
                    this.dispatchStats(patch as RealtimeStatsUpdate);
                }
            };

            this.channel
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'activity_logs',
                        filter: userFilter
                    },
                    (payload) => {
                        this.dispatchActivity(
                            this.formatActivityLog(payload.new as RawActivityLog)
                        );
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'activity_logs',
                        filter: userFilter
                    },
                    () => {
                        // Borrado masivo desde zona peligrosa— limpiar el feed local
                        this.dispatchActivityDelete();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_stats',
                        filter: userFilter
                    },
                    statsHandler
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_stats',
                        filter: userFilter
                    },
                    statsHandler
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_daily_stats',
                        filter: userFilter
                    },
                    dailyStatsHandler
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_daily_stats',
                        filter: userFilter
                    },
                    dailyStatsHandler
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        this.onConnectionChange?.(true);
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.isConnected = false;
                        this.onConnectionChange?.(false);
                        const transportFailed = isTransportFailure(err);
                        const benign = isBenignRealtimeClose(err, this.intentionalClose);

                        if (transportFailed && !this.intentionalClose) {
                            debugWarn(
                                '[Realtime] WebSocket no disponible — el dashboard usará polling. ' +
                                    'Comprueba Realtime en Supabase (Database → Tables → Enable Realtime).'
                            );
                        } else if (err && !benign) {
                            logError('Realtime', err, 'Channel error');
                        }

                        this.tearDownClient();

                        if (benign && hasActiveSubscribers()) {
                            requestRealtimeReconnect('benign');
                        } else if (!benign && !this.intentionalClose) {
                            this.onDisconnectCallback?.();
                            requestRealtimeReconnect('error');
                        }
                        this.intentionalClose = false;
                    }
                });

            return true;
        } catch {
            return false;
        }
    }

    private setupTokenRefresh(): void {
        if (this.refreshInterval) clearInterval(this.refreshInterval);

        this.refreshInterval = setInterval(async () => {
            const newToken = await this.fetchToken();
            if (newToken && this.supabase?.realtime) {
                (this.supabase.realtime as { setAuth: (t: string) => void }).setAuth(newToken);
            }
        }, 600_000);
    }

    async connect(
        onDisconnect?: () => void,
        onConnectionChange?: (connected: boolean) => void
    ): Promise<boolean> {
        this.onDisconnectCallback = onDisconnect ?? null;
        this.onConnectionChange = onConnectionChange ?? null;
        this.intentionalClose = false;

        if (isRealtimeInCooldown()) {
            onConnectionChange?.(false);
            return false;
        }

        if (!this.hasValidCredentials() || !this.session?.userId) {
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            onConnectionChange?.(false);
            return false;
        }

        if (!(await this.initializeClient())) {
            onConnectionChange?.(false);
            return false;
        }
        if (!(await this.setupChannel())) {
            onConnectionChange?.(false);
            return false;
        }

        for (let i = 0; i < 50 && !this.isConnected; i++) {
            await new Promise((r) => setTimeout(r, 100));
        }

        if (!this.isConnected) {
            this.tearDownClient();
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            onConnectionChange?.(false);
            return false;
        }

        this.setupTokenRefresh();
        return true;
    }

    disconnect(): void {
        this.intentionalClose = true;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.tearDownClient();
        this.token = null;
        this.tokenExpiry = 0;
    }
}

let realtimeServiceInstance: RealtimeService | null = null;
let activeSessionKey: string | null = null;
const subscribers = new Map<string, SubscriberEntry>();
let connectInFlight: Promise<boolean> | null = null;
let destroyTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

const MAX_RECONNECT_ATTEMPTS = 6;
const RECONNECT_BASE_MS = 1200;

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
    if (typeof window === 'undefined' || pageIsUnloading) return;
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

hasActiveSubscribers = () => subscribers.size > 0;
requestRealtimeReconnect = scheduleReconnect;

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
    kind: 'stats' | 'activity' | 'activityDelete',
    payload: RealtimeStatsUpdate | ActivityLogItem | null
): void {
    for (const entry of subscribers.values()) {
        if (kind === 'stats') {
            entry.callbacks.onStatsUpdate(payload as RealtimeStatsUpdate);
        } else if (kind === 'activity') {
            entry.callbacks.onActivityInsert(payload as ActivityLogItem);
        } else if (kind === 'activityDelete') {
            entry.callbacks.onActivityDelete?.();
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
        realtimeServiceInstance = new RealtimeService(session);
        activeSessionKey = key;
        connectInFlight = null;
    }

    realtimeServiceInstance.setDispatchers(
        (stats) => dispatchToSubscribers('stats', stats),
        (log) => dispatchToSubscribers('activity', log),
        () => dispatchToSubscribers('activityDelete', null)
    );

    return realtimeServiceInstance;
}

async function ensureConnected(session: Session): Promise<boolean> {
    await waitForStablePage();
    if (subscribers.size === 0) return false;

    const service = ensureService(session);
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
