import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';
import { dashboardStore, ActivityLog, StatsData } from './dashboardStore.js';
import { Session } from '../types.js';

// Interfaz que mapea las columnas reales de la tabla user_stats en Supabase
interface RawUserStats {
    today_requests?: number;
    today_errors?: number;
    today_latency?: number;
    total_requests?: number;
    [key: string]: unknown;
}

// Interfaz que mapea las columnas reales de activity_logs en Supabase
interface RawActivityLog {
    activity_type?: string;
    user_name?: string;
    detail?: string;
    created_at?: string;
    [key: string]: unknown;
}

/**
 * Servicio de Supabase Realtime para sincronización en tiempo real
 * del dashboard. Se conecta a las tablas activity_logs y user_stats.
 */
export class RealtimeService {
    private supabase: ReturnType<typeof createClient> | null = null;
    private channel: RealtimeChannel | null = null;
    private token: string | null = null;
    private tokenExpiry: number = 0; // timestamp ms en que expira el token actual
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private session: Session | null = null;
    private isConnected: boolean = false;
    private onDisconnectCallback: (() => void) | null = null;

    /**
     * Inicializa el servicio de realtime con la sesión del usuario
     */
    constructor(session: Session) {
        this.session = session;
    }

    /**
     * Verifica si hay credenciales válidas para autenticación
     */
    private hasValidCredentials(): boolean {
        return !!(this.session?.token || this.session?.apiKey);
    }

    /**
     * Obtiene un token JWT firmado del backend para autenticación con Supabase
     */
    private async fetchToken(): Promise<string | null> {
        // Reusar token en memoria si sigue válido (con 60s de margen de seguridad)
        // Evita un round-trip innecesario a Vercel en cada resume()
        if (this.token && Date.now() < this.tokenExpiry - 60_000) {
            return this.token;
        }

        // Verificar que haya credenciales antes de intentar
        if (!this.hasValidCredentials()) {
            console.warn('[Realtime] No authentication credentials available');
            return null;
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            // Agregar token de Twitch si existe
            if (this.session?.token) {
                headers['Authorization'] = `Bearer ${this.session.token}`;
            }

            // Agregar API Key si existe (fallback para autenticación)
            if (this.session?.apiKey) {
                headers['x-api-key'] = this.session.apiKey;
            }

            const url = `${CONFIG.API_URL}/system/realtime-token`;

            const response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('[Realtime] Authentication failed: Session expired or invalid');
                    window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
                } else {
                    console.error('[Realtime] Failed to fetch token:', response.status);
                }
                return null;
            }

            const data = await response.json();

            if (!data.token) {
                console.error('[Realtime] Token missing in response');
                return null;
            }

            this.token = data.token;
            // Guardar cuándo expira para reutilizarlo en futuros resume()
            // El backend ahora devuelve expiresAt en ms
            this.tokenExpiry = data.expiresAt ?? Date.now() + (data.expiresIn ?? 900) * 1000;
            return this.token;
        } catch (error) {
            console.error('[Realtime] Error fetching token:', error);
            return null;
        }
    }

    /**
     * Inicializa el cliente de Supabase
     */
    private initializeClient(): boolean {
        if (this.supabase) return true;
        try {
            // Crear cliente de Supabase básico
            this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });

            console.log('[Realtime] Supabase client initialized');
            return true;
        } catch (error) {
            console.error('[Realtime] Error initializing Supabase client:', error);
            return false;
        }
    }

    /**
     * Crea y configura el canal de realtime para el usuario
     */
    private async setupChannel(): Promise<boolean> {
        if (this.channel) return true;
        if (!this.supabase || !this.session?.userId) return false;

        // Obtener token JWT para autenticación
        const token = await this.fetchToken();
        if (!token) {
            console.error('[Realtime] Cannot setup channel: No token available');
            return false;
        }

        try {
            const channelName = `dashboard:${this.session.userId}`;

            // Crear canal
            this.channel = this.supabase.channel(channelName);

            // Establecer el token de autenticación para realtime
            if (this.supabase.realtime) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.supabase.realtime as any).setAuth(token);
            }

            // Configurar listeners
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
                        this.handleActivityLogInsert(payload.new as RawActivityLog);
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
                        this.handleStatsUpdate(payload.new as RawUserStats);
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.isConnected = false;
                        if (err) console.warn('[Realtime] Channel error:', err);
                        this.onDisconnectCallback?.();
                    }
                });

            return true;
        } catch (error) {
            console.error('[Realtime] Error setting up channel:', error);
            return false;
        }
    }

    /**
     * Transforma un activity_log crudo de Supabase al formato que usa el frontend
     */
    private formatActivityLog(raw: RawActivityLog): ActivityLog {
        const type = raw.activity_type || 'other';
        const user = raw.user_name || 'Usuario';
        const detail = raw.detail || '';
        let action = '';

        switch (type) {
            case 'clip':
                action = `\u{1F4FA} Nuevo clip creado por @${user} (${detail})`;
                break;
            case 'followage':
                action = `\u{23F1}\u{FE0F} @${user} revisó su followage en ${detail}`;
                break;
            case 'shoutout':
                action = `\u{1F5E3}\u{FE0F} Shoutout de @${user}`;
                break;
            case 'message':
                action = `\u{1F4AC} Mensaje enviado: "${detail}"`;
                break;
            case 'russian':
                action = `\u{1F52B} @${user} jugó la Ruleta Rusa`;
                break;
            case 'magic8':
                action = `\u{1F3B1} @${user} preguntó a la Bola 8`;
                break;
            case 'duel':
                action = `\u{2694}\u{FE0F} @${user} inició un duelo con @${detail}`;
                break;
            case 'stalker':
                action = `\u{1F575}\u{FE0F} @${user} inició escaneo de Stalker`;
                break;
            case 'trends':
                action = `\u{1F4CA} @${user} inició rastreo de Tendencias`;
                break;
            case 'roulette':
                action = `\u{1F3B2} @${user} consultó la Ruleta de Chatters`;
                break;
            default:
                action = `\u{1F539} Actividad: ${type} por @${user}`;
        }

        return {
            action,
            timestamp: raw.created_at || new Date().toISOString()
        };
    }

    /**
     * Computa las métricas de stats a partir de las columnas crudas de la DB
     */
    private computeStats(raw: RawUserStats): StatsData {
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

    /**
     * Maneja nuevos registros de activity_logs
     */
    private handleActivityLogInsert(raw: RawActivityLog): void {
        const newLog = this.formatActivityLog(raw);
        const currentLogs = dashboardStore.getState().activityLogs;

        // Evitar duplicados por timestamp + action
        const exists = currentLogs.some(
            (log) => log.timestamp === newLog.timestamp && log.action === newLog.action
        );

        if (!exists) {
            dashboardStore.setState({
                activityLogs: [newLog, ...currentLogs].slice(0, 50)
            });
        }
    }

    /**
     * Maneja actualizaciones de user_stats
     */
    private handleStatsUpdate(raw: RawUserStats): void {
        dashboardStore.setState({
            stats: this.computeStats(raw)
        });
    }

    /**
     * Configura el renovado automático del token cada 10 minutos.
     * El JWT ahora dura 15 min → margen de 5 min de seguridad.
     * Antes era cada 4 min con tokens de 5 min → -60% de llamadas a Vercel.
     */
    private setupTokenRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(async () => {
            const newToken = await this.fetchToken();
            if (newToken && this.supabase?.realtime) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.supabase.realtime as any).setAuth(newToken);
            }
        }, 600_000); // 10 minutos
    }

    /**
     * Inicia la conexión de realtime
     * @param onDisconnect Callback ejecutado si la conexión falla o se cierra
     * @returns true si la conexión fue exitosa
     */
    async connect(onDisconnect?: () => void): Promise<boolean> {
        this.onDisconnectCallback = onDisconnect || null;

        if (!this.hasValidCredentials()) {
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            return false;
        }

        if (!this.session?.userId) {
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            return false;
        }

        const initialized = this.initializeClient();
        if (!initialized) return false;

        const channelSetup = await this.setupChannel();
        if (!channelSetup) return false;

        // Esperar hasta 3s, pero salir temprano si ya conectó
        for (let i = 0; i < 30 && !this.isConnected; i++) {
            await new Promise((r) => setTimeout(r, 100));
        }

        this.setupTokenRefresh();
        return this.isConnected;
    }

    /**
     * PAUSA el servicio sin cerrar el WebSocket de Supabase.
     * Solo detiene el renovado automático del token para no despertar
     * a Vercel cada 4 minutos mientras el usuario no está en Home.
     * Llamar cuando el módulo Home se desactiva.
     */
    pause(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        console.log('[Realtime] Paused – WebSocket kept alive, token refresh stopped');
    }

    /**
     * REANUDA el servicio después de una pausa.
     * Si el WebSocket sigue vivo, solo reinicia el timer de refresco.
     * Si el canal se cayó mientras estaba en pausa, reconecta completamente.
     * Llamar cuando el módulo Home se activa de nuevo.
     * @returns true si está (o quedó) conectado
     */
    async resume(): Promise<boolean> {
        if (!this.isConnected || !this.channel) {
            // El canal se cayó mientras estábamos pausados → reconexión completa
            console.warn('[Realtime] Resuming but channel is gone, reconnecting...');
            return this.connect(this.onDisconnectCallback ?? undefined);
        }
        // WebSocket sigue activo, solo reiniciamos el timer
        this.setupTokenRefresh();
        console.log('[Realtime] Resumed – token refresh restarted');
        return true;
    }

    /**
     * DESTRUYE completamente la conexión y limpia todos los recursos.
     * Usar únicamente en logout o cuando cambia el usuario.
     * Para navegación normal entre secciones, usar pause() / resume().
     */
    disconnect(): void {
        // Limpiar interval de refresco
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Desuscribir y destruir el canal
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }

        // Destruir cliente Supabase completamente
        if (this.supabase) {
            this.supabase.removeAllChannels();
            this.supabase = null;
        }

        this.isConnected = false;
        this.token = null;
        console.log('[Realtime] Disconnected – all resources released');
    }

    /**
     * Verifica si el canal está conectado
     */
    getIsConnected(): boolean {
        return this.isConnected;
    }
}

/**
 * Singleton para el servicio de realtime
 */
let realtimeServiceInstance: RealtimeService | null = null;

export const RealtimeServiceFactory = {
    /**
     * Crea o retorna la instancia del servicio
     */
    getInstance(session: Session): RealtimeService {
        if (
            !realtimeServiceInstance ||
            realtimeServiceInstance['session']?.userId !== session.userId ||
            realtimeServiceInstance['session']?.apiKey !== session.apiKey
        ) {
            if (realtimeServiceInstance) realtimeServiceInstance.disconnect();
            realtimeServiceInstance = new RealtimeService(session);
        }
        return realtimeServiceInstance;
    },

    /**
     * Destruye la instancia actual
     */
    destroy(): void {
        if (realtimeServiceInstance) {
            realtimeServiceInstance.disconnect();
            realtimeServiceInstance = null;
        }
    }
};
