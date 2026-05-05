import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';
import { dashboardStore, ActivityLog, StatsData } from './dashboardStore.js';
import { Session } from '../types.js';

/**
 * Servicio de Supabase Realtime para sincronización en tiempo real
 * del dashboard. Se conecta a las tablas activity_logs y user_stats.
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
     * Verifica si hay credenciales válidas para autenticación
     */
    private hasValidCredentials(): boolean {
        return !!(this.session?.token || this.session?.apiKey);
    }

    /**
     * Obtiene un token JWT firmado del backend para autenticación con Supabase
     */
    private async fetchToken(): Promise<string | null> {
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
            console.log('[Realtime] Fetching token from:', url);
            console.log('[Realtime] Headers present:', Object.keys(headers));

            const response = await fetch(url, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            console.log('[Realtime] Response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('[Realtime] Authentication failed: Session expired or invalid');
                    // Emitir evento para que el dashboard maneje la redirección al login
                    window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
                } else {
                    console.error('[Realtime] Failed to fetch token:', response.status);
                    // Intentar leer el cuerpo del error
                    try {
                        const errorText = await response.text();
                        console.error('[Realtime] Error response:', errorText);
                    } catch (_e) {
                        // Ignorar error al leer cuerpo
                    }
                }
                return null;
            }

            const data = await response.json();
            console.log('[Realtime] Response data:', data);

            if (!data.token) {
                console.error('[Realtime] Token missing in response:', data);
                return null;
            }

            this.token = data.token;
            this.tokenExpiry = data.expiresAt;

            console.log(
                '[Realtime] Token obtained successfully, expires at:',
                new Date(data.expiresAt).toLocaleTimeString()
            );
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
        if (!this.supabase || !this.session?.userId) return false;

        // Obtener token JWT para autenticación
        const token = await this.fetchToken();
        if (!token) {
            console.error('[Realtime] Cannot setup channel: No token available');
            return false;
        }

        try {
            const channelName = `dashboard:${this.session.userId}`;
            console.log('[Realtime] Setting up channel:', channelName);

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
                        console.log('[Realtime] Received activity log:', payload);
                        this.handleActivityLogInsert(payload.new as ActivityLog);
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
                        console.log('[Realtime] Received stats update:', payload);
                        this.handleStatsUpdate(payload.new as StatsData);
                    }
                )
                .subscribe((status, err) => {
                    console.log('[Realtime] Subscription status:', status);

                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        console.log('[Realtime] Successfully subscribed to channel');
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.isConnected = false;
                        console.error('[Realtime] Channel error or closed:', err);
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
     * Maneja actualizaciones de user_stats
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
            console.log('[Realtime] Token refresh interval - reconnecting with new token...');
            // Desconectar y reconectar con nuevo token
            this.disconnect();
            await this.connect(this.onDisconnectCallback || undefined);
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

        // Verificar credenciales antes de intentar conectar
        if (!this.hasValidCredentials()) {
            console.error('[Realtime] Cannot connect: No authentication credentials');
            // Modo estricto: sin credenciales = redirigir al login
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            return false;
        }

        // Verificar que haya userId
        if (!this.session?.userId) {
            console.error('[Realtime] Cannot connect: No userId in session');
            // Modo estricto: sin userId = redirigir al login
            window.dispatchEvent(new CustomEvent('realtime:auth-failed'));
            return false;
        }

        const initialized = this.initializeClient();
        if (!initialized) {
            console.error('[Realtime] Failed to initialize client');
            return false;
        }

        const channelSetup = await this.setupChannel();
        if (!channelSetup) {
            console.error('[Realtime] Failed to setup channel');
            return false;
        }

        // Esperar un momento para ver si la conexión se establece
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!this.isConnected) {
            console.warn(
                '[Realtime] Connection not established after 2s, will retry or use fallback'
            );
        }

        this.setupTokenRefresh();

        console.log('[Realtime] Connection attempt completed, isConnected:', this.isConnected);
        return this.isConnected;
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
