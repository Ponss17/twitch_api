import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { logError } from '@/core/logging/logError';
import { debugWarn } from '@/core/logging/debugLog';

import type { ActivityLogItem } from '../activityLogDisplay';
import {
    parseDashboardStatsFromRow,
    getStatsLocalDateString,
    type DashboardLiveStats,
    type DailyStatsRealtimePatch,
    type RealtimeStatsUpdate
} from '../dashboardStats';

import type { RawActivityLog } from './types';
import { isTransportFailure, isBenignRealtimeClose, installUnloadGuard } from './errors';
import { isRealtimeInCooldown } from './cooldown';
import { getSharedSupabaseClient } from './client';
import { formatActivityLog } from './formatters';

type ReconnectReason = 'benign' | 'error' | 'failed';

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

    private readonly requestRealtimeReconnect: (reason: ReconnectReason) => void;
    private readonly hasActiveSubscribers: () => boolean;

    constructor(
        session: Session,
        requestRealtimeReconnect: (reason: ReconnectReason) => void,
        hasActiveSubscribers: () => boolean
    ) {
        installUnloadGuard();
        this.session = session;
        this.requestRealtimeReconnect = requestRealtimeReconnect;
        this.hasActiveSubscribers = hasActiveSubscribers;
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
        return !!(this.session?.userId || this.session?.token || this.session?.apiKey);
    }

    private async fetchToken(): Promise<string | null> {
        if (this.token && Date.now() < this.tokenExpiry - 60_000) {
            return this.token;
        }

        if (!this.hasValidCredentials() || !this.session) return null;

        try {
            const response = await fetch(API_ENDPOINTS.REALTIME_TOKEN, withApiCredentials({
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(this.session)
                }
            }));

            if (!response.ok) {
                if (response.status === 401) {
                    window.dispatchEvent(new CustomEvent('session:auth-failed'));
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

    private handleStatsRow(raw: Record<string, unknown>): void {
        // Si last_stats_date es de "ayer" según TZ del browser, no aplicar el patch
        // (evita poner analytics a 0 cerca de medianoche por mismatch de zona).
        const patch = parseDashboardStatsFromRow(raw, {
            isPartialUpdate: true,
            todayLocal: getStatsLocalDateString()
        });
        if (Object.keys(patch).length === 0) return;
        this.dispatchStats(patch as DashboardLiveStats);
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
                            formatActivityLog(payload.new as RawActivityLog)
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

                        if (benign && this.hasActiveSubscribers()) {
                            this.requestRealtimeReconnect('benign');
                        } else if (!benign && !this.intentionalClose) {
                            this.onDisconnectCallback?.();
                            this.requestRealtimeReconnect('error');
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
