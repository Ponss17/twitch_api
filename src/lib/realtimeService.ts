import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { API_ENDPOINTS, SUPABASE_ANON_KEY, SUPABASE_URL, type Session } from './config';
import type { ActivityLogItem } from './activityLogDisplay';
import {
    parseDashboardStatsFromRow,
    type DashboardLiveStats
} from './dashboardStats';
import { authHeaders } from './auth';
import { logError } from './logError';
import { debugWarn } from './debugLog';

const REALTIME_COOLDOWN_SESSION_KEY = 'realtime_cooldown_until';
const REALTIME_COOLDOWN_MS = 5 * 60 * 1000;

let pageIsUnloading = false;
let unloadGuardInstalled = false;
let realtimeCooldownUntil = 0;

/** Un solo cliente Supabase por pestaña (evita GoTrueClient duplicados). */
let sharedSupabaseClient: SupabaseClient | null = null;

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

    const cause = err instanceof Error ? (err as Error & { cause?: { code?: number } }).cause : undefined;
    if (cause && typeof cause === 'object' && typeof cause.code === 'number') {
        return cause.code === 1000 || cause.code === 1001;
    }

    return false;
}

interface RawActivityLog {
    activity_type?: string;
    user_name?: string;
    detail?: string;
    created_at?: string;
}

/** @deprecated Usar DashboardLiveStats */
export type HomeStats = Pick<
    DashboardLiveStats,
    'todayRequests' | 'rawSuccessRate' | 'avgLatencyMs'
>;

export interface RealtimeCallbacks {
    onStatsUpdate: (stats: DashboardLiveStats) => void;
    onActivityInsert: (log: ActivityLogItem) => void;
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

export class RealtimeService {
    private supabase: SupabaseClient | null = null;
    private channel: RealtimeChannel | null = null;
    private token: string | null = null;
    private tokenExpiry = 0;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private session: Session | null = null;
    private dispatchStats: (stats: DashboardLiveStats) => void = () => {};
    private dispatchActivity: (log: ActivityLogItem) => void = () => {};
    private isConnected = false;
    private intentionalClose = false;
    private onDisconnectCallback: (() => void) | null = null;
    private onConnectionChange: ((connected: boolean) => void) | null = null;

    constructor(session: Session) {
        installUnloadGuard();
        this.session = session;
    }

    setDispatchers(
        onStats: (stats: DashboardLiveStats) => void,
        onActivity: (log: ActivityLogItem) => void
    ): void {
        this.dispatchStats = onStats;
        this.dispatchActivity = onActivity;
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

        sharedSupabaseClient = null;
        this.isTearingDown = false;
    }

    private async initializeClient(): Promise<boolean> {
        if (this.supabase) return true;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logError('Realtime', 'Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env');
            return false;
        }
        try {
            if (!sharedSupabaseClient) {
                const { createClient } = await import('@supabase/supabase-js');
                sharedSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
                    realtime: {
                        params: { apikey: SUPABASE_ANON_KEY }
                    }
                });
            }
            this.supabase = sharedSupabaseClient;
            return true;
        } catch {
            return false;
        }
    }

    formatActivityLog(raw: RawActivityLog): ActivityLogItem {
        const type = raw.activity_type || 'other';
        const user = raw.user_name || 'Usuario';
        const detail = raw.detail?.trim() || undefined;

        return {
            type,
            user,
            detail,
            timestamp: raw.created_at || new Date().toISOString()
        };
    }

    computeStats(raw: Record<string, unknown>): DashboardLiveStats {
        return parseDashboardStatsFromRow(raw);
    }

    private handleStatsRow(raw: Record<string, unknown>): void {
        this.dispatchStats(parseDashboardStatsFromRow(raw));
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
                            markRealtimeCooldown();
                            debugWarn(
                                '[Realtime] WebSocket no disponible — el dashboard usará polling. ' +
                                    'Comprueba Realtime en Supabase (Database → Tables → Enable Realtime).'
                            );
                        } else if (err && !benign) {
                            logError('Realtime', err, 'Channel error');
                        }

                        this.tearDownClient();

                        if (!benign && !this.intentionalClose) {
                            this.onDisconnectCallback?.();
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

        if (isRealtimeInCooldown()) {
            return false;
        }

        if (!this.hasValidCredentials() || !this.session?.userId) {
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            return false;
        }

        if (!(await this.initializeClient())) return false;
        if (!(await this.setupChannel())) return false;

        for (let i = 0; i < 30 && !this.isConnected; i++) {
            await new Promise((r) => setTimeout(r, 100));
        }

        if (!this.isConnected) {
            markRealtimeCooldown();
            this.tearDownClient();
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
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

function dispatchToSubscribers(
    kind: 'stats' | 'activity',
    payload: DashboardLiveStats | ActivityLogItem
): void {
    for (const entry of subscribers.values()) {
        if (kind === 'stats') {
            entry.callbacks.onStatsUpdate(payload as DashboardLiveStats);
        } else {
            entry.callbacks.onActivityInsert(payload as ActivityLogItem);
        }
    }
}

function notifyConnection(connected: boolean): void {
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
        (log) => dispatchToSubscribers('activity', log)
    );

    return realtimeServiceInstance;
}

async function ensureConnected(session: Session): Promise<boolean> {
    const service = ensureService(session);
    if (service.connected) return true;
    if (connectInFlight) return connectInFlight;

    connectInFlight = service
        .connect(
            () => notifyDisconnect(),
            (connected) => notifyConnection(connected)
        )
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
        subscribers.set(id, { session, callbacks, options });
        void ensureConnected(session);
        if (realtimeServiceInstance?.connected) {
            options.onConnectionChange?.(true);
        }
        return () => {
            subscribers.delete(id);
            if (subscribers.size === 0) {
                RealtimeServiceFactory.destroy();
            }
        };
    },

    isConnected(): boolean {
        return realtimeServiceInstance?.connected ?? false;
    },

    destroy(): void {
        subscribers.clear();
        connectInFlight = null;
        activeSessionKey = null;
        if (realtimeServiceInstance) {
            realtimeServiceInstance.disconnect();
            realtimeServiceInstance = null;
        }
    }
};
