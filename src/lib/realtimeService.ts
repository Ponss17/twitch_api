import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { API_ENDPOINTS, SUPABASE_ANON_KEY, SUPABASE_URL, type Session } from './config';
import type { ActivityLogItem } from './activityLogDisplay';
import { authHeaders } from './auth';
import { logError } from './logError';

let pageIsUnloading = false;
let unloadGuardInstalled = false;
let realtimeCooldownUntil = 0;

const REALTIME_COOLDOWN_MS = 5 * 60 * 1000;

export function isRealtimeInCooldown(): boolean {
    return Date.now() < realtimeCooldownUntil;
}

function markRealtimeCooldown(): void {
    realtimeCooldownUntil = Date.now() + REALTIME_COOLDOWN_MS;
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

interface RawUserStats {
    today_requests?: number;
    today_errors?: number;
    today_latency?: number;
    total_requests?: number;
}

interface RawActivityLog {
    activity_type?: string;
    user_name?: string;
    detail?: string;
    created_at?: string;
}

export interface HomeStats {
    todayRequests: number;
    rawSuccessRate: number;
    avgLatencyMs: number;
}

export interface RealtimeCallbacks {
    onStatsUpdate: (stats: HomeStats) => void;
    onActivityInsert: (log: ActivityLogItem) => void;
}

export class RealtimeService {
    private supabase: SupabaseClient | null = null;
    private channel: RealtimeChannel | null = null;
    private token: string | null = null;
    private tokenExpiry = 0;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private session: Session | null = null;
    private callbacks: RealtimeCallbacks | null = null;
    private isConnected = false;
    private intentionalClose = false;
    private onDisconnectCallback: (() => void) | null = null;

    constructor(session: Session, callbacks: RealtimeCallbacks) {
        installUnloadGuard();
        this.session = session;
        this.callbacks = callbacks;
    }

    setCallbacks(callbacks: RealtimeCallbacks): void {
        this.callbacks = callbacks;
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

    private tearDownClient(): void {
        if (this.channel) {
            try {
                this.channel.unsubscribe();
            } catch {
                /* ignore */
            }
            this.channel = null;
        }

        if (this.supabase) {
            try {
                this.supabase.removeAllChannels();
                this.supabase.realtime.disconnect();
            } catch {
                /* ignore */
            }
            this.supabase = null;
        }
    }

    private async initializeClient(): Promise<boolean> {
        if (this.supabase) return true;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logError('Realtime', 'Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env');
            return false;
        }
        try {
            const { createClient } = await import('@supabase/supabase-js');
            this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: { persistSession: false, autoRefreshToken: false },
                realtime: {
                    params: { apikey: SUPABASE_ANON_KEY }
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    private formatActivityLog(raw: RawActivityLog): ActivityLogItem {
        const type = raw.activity_type || 'other';
        const user = raw.user_name || 'Usuario';
        const detail = raw.detail || '';
        let action = '';

        switch (type) {
            case 'clip':
                action = `📺 Nuevo clip creado por @${user} (${detail})`;
                break;
            case 'followage':
                action = `⏱️ @${user} revisó su followage en ${detail}`;
                break;
            case 'shoutout':
                action = `🗣️ Shoutout de @${user}`;
                break;
            case 'message':
                action = `💬 Mensaje enviado: "${detail}"`;
                break;
            case 'russian':
                action = `🔫 @${user} jugó la Ruleta Rusa`;
                break;
            case 'magic8':
                action = `🎱 @${user} preguntó a la Bola 8`;
                break;
            case 'duel':
                action = `⚔️ @${user} inició un duelo con @${detail}`;
                break;
            case 'stalker':
                action = `🕵️ @${user} inició escaneo de Stalker`;
                break;
            case 'trends':
                action = `📊 @${user} inició rastreo de Tendencias`;
                break;
            case 'roulette':
                action = `🎲 @${user} consultó la Ruleta de Chatters`;
                break;
            default:
                action = `🔹 Actividad: ${type} por @${user}`;
        }

        return { action, user, timestamp: raw.created_at || new Date().toISOString() };
    }

    private computeStats(raw: RawUserStats): HomeStats {
        const todayRequests = raw.today_requests || 0;
        const todayErrors = raw.today_errors || 0;
        const todayLatency = raw.today_latency || 0;
        const avgLatencyMs = todayRequests > 0 ? Math.round(todayLatency / todayRequests) : 0;
        const rawSuccessRate =
            todayRequests > 0
                ? parseFloat(((1 - todayErrors / todayRequests) * 100).toFixed(1))
                : 0;

        return { todayRequests, rawSuccessRate, avgLatencyMs };
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

            this.channel
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'activity_logs',
                        filter: `user_id=eq.${this.session.userId}`
                    },
                    (payload) => {
                        this.callbacks?.onActivityInsert(
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
                        filter: `user_id=eq.${this.session.userId}`
                    },
                    (payload) => {
                        this.callbacks?.onStatsUpdate(
                            this.computeStats(payload.new as RawUserStats)
                        );
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.isConnected = false;
                        const transportFailed = isTransportFailure(err);
                        const benign = isBenignRealtimeClose(err, this.intentionalClose);

                        if (transportFailed && !this.intentionalClose) {
                            markRealtimeCooldown();
                            console.warn(
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

    async connect(onDisconnect?: () => void): Promise<boolean> {
        this.onDisconnectCallback = onDisconnect ?? null;

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

    pause(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async resume(): Promise<boolean> {
        if (!this.isConnected || !this.channel) {
            return this.connect(this.onDisconnectCallback ?? undefined);
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
        this.isConnected = false;
        this.token = null;
        this.tokenExpiry = 0;
    }
}

let realtimeServiceInstance: RealtimeService | null = null;

export const RealtimeServiceFactory = {
    getInstance(session: Session, callbacks: RealtimeCallbacks): RealtimeService {
        if (
            !realtimeServiceInstance ||
            realtimeServiceInstance['session']?.userId !== session.userId ||
            realtimeServiceInstance['session']?.apiKey !== session.apiKey ||
            realtimeServiceInstance['session']?.token !== session.token
        ) {
            if (realtimeServiceInstance) realtimeServiceInstance.disconnect();
            realtimeServiceInstance = new RealtimeService(session, callbacks);
        } else {
            realtimeServiceInstance.setCallbacks(callbacks);
        }
        return realtimeServiceInstance;
    },

    destroy(): void {
        if (realtimeServiceInstance) {
            realtimeServiceInstance.disconnect();
            realtimeServiceInstance = null;
        }
    }
};
