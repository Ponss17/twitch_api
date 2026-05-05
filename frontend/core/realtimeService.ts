import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';
import { dashboardStore, ActivityLog, StatsData } from './dashboardStore.js';
import { Session } from '../types.js';

/**
 * Servicio de Supabase Realtime para sincronización en tiempo real
 * del dashboard. Se conecta a las tablas activity_logs y daily_stats.
 */
export class RealtimeService {
    private supabase: ReturnType<typeof createClient> | null = null;
    private channel: RealtimeChannel | null = null;
    private token: string | null = null;
    private tokenExpiry: number = 0;
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
     * Obtiene un token JWT firmado del backend para autenticación con Supabase
     */
    private async fetchToken(): Promise<string | null> {
        try {
            const response = await fetch(`${CONFIG.API_URL}/system/realtime-token`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.session?.token || ''}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('[Realtime] Failed to fetch token:', response.status);
                return null;
            }

            const data = await response.json();
            this.token = data.token;
            this.tokenExpiry = data.expiresAt;

            console.log(
                '[Realtime] Token obtained, expires at:',
                new Date(data.expiresAt).toLocaleTimeString()
            );
            return this.token;
        } catch (error) {
            console.error('[Realtime] Error fetching token:', error);
            return null;
        }
    }

    /**
     * Inicializa el cliente de Supabase con el token JWT
     */
    private async initializeClient(): Promise<boolean> {
        const token = await this.fetchToken();
        if (!token) return false;

        try {
            // Crear cliente de Supabase con el token personalizado
            this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });

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
        if (!this.supabase || !this.session?.userId) return false;

        try {
            const channelName = `dashboard:${this.session.userId}`;

            this.channel = this.supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'activity_logs',
                        filter: `user_id=eq.${this.session.userId}`
                    },
                    (payload) => {
                        this.handleActivityLogInsert(payload.new as ActivityLog);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'daily_stats',
                        filter: `user_id=eq.${this.session.userId}`
                    },
                    (payload) => {
                        this.handleStatsUpdate(payload.new as StatsData);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Subscription status:', status);

                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.isConnected = false;
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
     * Maneja nuevos registros de activity_logs
     */
    private handleActivityLogInsert(newLog: ActivityLog): void {
        console.log('[Realtime] New activity log received:', newLog);

        const currentLogs = dashboardStore.getState().activityLogs;

        // Evitar duplicados
        const exists = currentLogs.some(
            (log) => log.timestamp === newLog.timestamp && log.action === newLog.action
        );

        if (!exists) {
            dashboardStore.setState({
                activityLogs: [newLog, ...currentLogs].slice(0, 50) // Mantener máximo 50 logs
            });
        }
    }

    /**
     * Maneja actualizaciones de daily_stats
     */
    private handleStatsUpdate(newStats: StatsData): void {
        console.log('[Realtime] Stats update received:', newStats);

        dashboardStore.setState({
            stats: newStats
        });
    }

    /**
     * Configura el renovado automático del token cada 4 minutos
     */
    private setupTokenRefresh(): void {
        // Limpiar intervalo anterior si existe
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Renovar token cada 4 minutos (240 segundos)
        this.refreshInterval = setInterval(async () => {
            console.log('[Realtime] Refreshing token...');
            const success = await this.initializeClient();

            if (success && this.channel) {
                // Reconectar el canal con el nuevo token
                await this.channel.unsubscribe();
                await this.setupChannel();
            }
        }, 240000); // 4 minutos
    }

    /**
     * Inicia la conexión de realtime
     * @param onDisconnect Callback ejecutado si la conexión falla o se cierra
     * @returns true si la conexión fue exitosa
     */
    async connect(onDisconnect?: () => void): Promise<boolean> {
        this.onDisconnectCallback = onDisconnect || null;

        console.log('[Realtime] Connecting...');

        const initialized = await this.initializeClient();
        if (!initialized) {
            console.error('[Realtime] Failed to initialize client');
            return false;
        }

        const channelSetup = await this.setupChannel();
        if (!channelSetup) {
            console.error('[Realtime] Failed to setup channel');
            return false;
        }

        this.setupTokenRefresh();

        console.log('[Realtime] Connected successfully');
        return true;
    }

    /**
     * Desconecta el canal y limpia recursos
     */
    disconnect(): void {
        console.log('[Realtime] Disconnecting...');

        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }

        if (this.supabase) {
            this.supabase.removeAllChannels();
            this.supabase = null;
        }

        this.isConnected = false;
        this.token = null;

        console.log('[Realtime] Disconnected');
    }

    /**
     * Verifica si está conectado
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
        if (!realtimeServiceInstance) {
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
