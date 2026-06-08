import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';
import { Loader } from '../../shared/utils/loader.js';
import { BaseModule } from '../../shared/utils/baseModule.js';
import { TabSyncService } from '../../shared/utils/tabSyncService.js';
import {
    dashboardStore,
    ActivityLog,
    StatsData,
    HealthStatus,
    ToastActions
} from '../../core/dashboardStore.js';
import { UI } from '../../core/ui-core.js';
import { RealtimeServiceFactory } from '../../core/realtimeService.js';

export const HomeModule = {
    ...BaseModule,
    session: null as Session | null,
    isInitialized: false,
    pollInterval: null as ReturnType<typeof setInterval> | null,
    visibilityHandler: null as (() => void) | null,
    syncService: null as TabSyncService | null,
    realtimeService: null as ReturnType<typeof RealtimeServiceFactory.getInstance> | null,
    useRealtime: false,
    unsubscribers: [] as Array<() => void>,
    _boundAuthFailed: null as (() => void) | null,
    healthInterval: null as ReturnType<typeof setInterval> | null,
    lastStats: {
        todayRequests: -1,
        successRate: -1,
        latency: -1
    },

    init(session: Session): void {
        this.session = session;
        this.isInitialized = true;
    },

    activate(): void {
        Loader.loadCSS('./css/sections/home.css');
        this.setupUI();

        if (!this.syncService) {
            this.syncService = new TabSyncService('dashboard_home_sync');
            this.setupSyncListeners();
        }

        this.setupStoreSubscriptions();

        // Intentar conectar con Supabase Realtime primero
        this.connectRealtime();
    },

    setupStoreSubscriptions(): void {
        this.unsubscribers.push(
            dashboardStore.on('activityLogs', (state) => this.renderActivity(state.activityLogs))
        );
        this.unsubscribers.push(
            dashboardStore.on('stats', (state) => {
                if (state.stats) this.renderStats(state.stats);
            })
        );
        this.unsubscribers.push(
            dashboardStore.on('health', (state) => {
                if (state.health) this.renderHealth(state.health);
            })
        );
        this.unsubscribers.push(
            dashboardStore.on('isLeader', (state) => this.updateSyncIndicator(state.isLeader))
        );

        this._boundAuthFailed = this.handleAuthFailed.bind(this);
        window.addEventListener('realtime:auth-failed', this._boundAuthFailed);
    },

    /**
     * Maneja fallo de autenticación en realtime
     * Redirige al login después de un breve delay para permitir que el usuario vea el error
     */
    handleAuthFailed(): void {
        console.warn('[Home] Authentication failed, redirecting to login...');
        // Mostrar mensaje al usuario antes de redirigir
        ToastActions.error('Sesión expirada. Redirigiendo al login...');

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
    },

    setupSyncListeners(): void {
        if (!this.syncService) return;

        this.syncService.on('LEADER_CHANGED', (payload: unknown) => {
            const data = payload as { isLeader: boolean };
            dashboardStore.setState({ isLeader: data.isLeader });
            if (data.isLeader) {
                this.performSync();
            }
        });

        this.syncService.on('SYNC_ACTIVITY', (payload: unknown) =>
            dashboardStore.setState({ activityLogs: payload as ActivityLog[] })
        );
        this.syncService.on('SYNC_STATS', (payload: unknown) =>
            dashboardStore.setState({ stats: payload as StatsData })
        );
        this.syncService.on('SYNC_HEALTH', (payload: unknown) =>
            dashboardStore.setState({ health: payload as HealthStatus })
        );
    },

    deactivate(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
            this.healthInterval = null;
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }
        if (this.syncService) {
            this.syncService.destroy();
            this.syncService = null;
        }

        // Desconectar realtime
        if (this.realtimeService) {
            // Ya NO destruimos la conexión aquí para mantener el WebSockets vivo entre pestañas
            // y evitar el log spam de "Multiple GoTrueClient instances".
            this.realtimeService = null;
        }

        // Limpiar suscripciones al Store reactivo
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];

        if (this._boundAuthFailed) {
            window.removeEventListener('realtime:auth-failed', this._boundAuthFailed);
            this._boundAuthFailed = null;
        }
    },

    /**
     * Intenta conectar con Supabase Realtime para actualizaciones en tiempo real
     * Modo estricto: Sin sesion valida = redirigir al login (no fallback)
     */
    async connectRealtime(): Promise<void> {
        // Modo estricto: Sin sesion = error de autenticacion
        if (!this.session) {
            console.error('[Home] No session available - authentication required');
            this.handleAuthFailed();
            return;
        }

        // Modo estricto: Sin credenciales validas = error de autenticacion
        const hasCredentials = this.session.token || this.session.apiKey;
        if (!hasCredentials) {
            console.error('[Home] No valid credentials in session - authentication required');
            this.handleAuthFailed();
            return;
        }

        try {
            console.log('[Home] Attempting realtime connection...');

            // Crear instancia del servicio de realtime
            this.realtimeService = RealtimeServiceFactory.getInstance(this.session);

            // Intentar conectar
            const connected = await this.realtimeService.connect(() => {
                // Callback si se desconecta - usar polling como fallback tecnico
                console.warn('[Home] Realtime disconnected, switching to polling');
                this.useRealtime = false;
                this.startSmartPolling();
            });

            if (connected) {
                console.log('[Home] Realtime connected successfully');
                this.useRealtime = true;

                // Cargar datos iniciales una sola vez por API
                this.loadInitialData();

                // Solo health check periódico (stats y activity llegan por WebSocket)
                this.startHealthPolling();

                // Actualizar indicador de sync
                const syncEl = document.getElementById('home-sync-indicator');
                if (syncEl) {
                    syncEl.textContent = 'Realtime';
                    syncEl.classList.add('realtime-active');
                }
            } else {
                // Fallo tecnico (no de autenticacion) - usar polling
                console.warn('[Home] Realtime connection failed, using polling fallback');
                this.useRealtime = false;
                this.startSmartPolling();
            }
        } catch (error) {
            console.error('[Home] Error connecting to realtime:', error);
            this.useRealtime = false;
            this.startSmartPolling();
        }
    },

    /**
     * Carga inicial de todos los datos via API (una sola vez)
     */
    async loadInitialData(): Promise<void> {
        const syncEl = document.getElementById('home-sync-indicator');
        if (syncEl) syncEl.classList.add('syncing');

        try {
            await Promise.all([
                this.loadRealActivity(),
                this.loadRealStats(),
                this.loadRealHealth()
            ]);
        } catch (e) {
            console.error('[Home] Error en carga inicial:', e);
        }

        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    },

    /**
     * Health check periódico cuando Realtime está conectado (cada 60s)
     * No necesita polling para stats/activity porque llegan por WebSocket
     */
    startHealthPolling(): void {
        if (this.healthInterval) clearInterval(this.healthInterval);

        this.healthInterval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            this.loadRealHealth();
        }, 300000); // Poll cada 5 minutos
    },

    startSmartPolling(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        const pollMs = 60000;

        // Inicializar isLeader si acaba de arrancar
        if (this.syncService) {
            dashboardStore.setState({ isLeader: this.syncService.getIsLeader() });
        }

        let countdown = 300;
        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                if (this.syncService?.getIsLeader()) this.performSync();
            }
        } else {
            if (this.syncService?.getIsLeader()) this.performSync();
        }

        dashboardStore.setState({ pollingCountdown: countdown });

        this.pollInterval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;

            let currentCountdown = dashboardStore.getState().pollingCountdown - 1;
            if (currentCountdown <= 0) {
                if (this.syncService?.getIsLeader()) this.performSync();
                currentCountdown = 300;
            }
            dashboardStore.setState({ pollingCountdown: currentCountdown });
        }, 1000);

        this.visibilityHandler = () => {
            if (
                document.visibilityState === 'visible' &&
                dashboardStore.getState().pollingCountdown <= 0
            ) {
                if (this.syncService?.getIsLeader()) this.performSync();
                dashboardStore.setState({ pollingCountdown: 300 });
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    },

    async performSync(): Promise<void> {
        if (!this.syncService?.getIsLeader()) return;

        const syncEl = document.getElementById('home-sync-indicator');
        if (syncEl) syncEl.classList.add('syncing');

        localStorage.setItem('dashboard_last_sync', Date.now().toString());

        try {
            await Promise.all([
                this.loadRealActivity(),
                this.loadRealStats(),
                this.loadRealHealth()
            ]);
        } catch (e) {
            console.error('[Home] Error en sync escalonado:', e);
        }

        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    },

    updateSyncIndicator(isLeader: boolean): void {
        const syncEl = document.getElementById('home-sync-indicator');
        if (!syncEl) return;
        if (!syncEl.classList.contains('syncing')) {
            syncEl.textContent = isLeader ? 'Leader' : 'Follower';
        }
    },

    updateValues(): void {
        if (this.session) {
            const heroName = document.getElementById('hero-user-name');
            if (heroName) {
                heroName.textContent = this.session.displayName || this.session.login || 'Streamer';
            }
        }
    },

    setupUI() {
        this.updateValues();
        this.setupNavigation();
    },

    setupNavigation() {
        const btns = document.querySelectorAll('.clickable-tab');
        btns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const tabId = (btn as HTMLElement).dataset.tab;
                if (!tabId) return;

                const sidebarBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
                if (sidebarBtn) {
                    (sidebarBtn as HTMLElement).click();
                }
            });
        });
    },

    async loadRealHealth(): Promise<void> {
        if (!this.session) return;
        try {
            const response = await fetch(`${API_ENDPOINTS.HEALTH}`, {
                headers: this.authHeaders()
            });
            if (response.ok) {
                const health = await response.json();
                this.syncService?.broadcast('SYNC_HEALTH', health);
                dashboardStore.setState({ health });
            }
        } catch (_e) {
            dashboardStore.setState({ health: { status: 'error' } });
        }
    },

    renderHealth(health: HealthStatus): void {
        const pill = document.getElementById('home-health-pill');
        const label = pill?.querySelector('.status-label');
        if (!pill || !label) return;

        if (health.status === 'error') {
            label.textContent = 'Error de Conexión';
            pill.className = 'system-status-pill down';
            return;
        }

        label.textContent =
            health.status === 'operational'
                ? 'Todos los Sistemas Operativos'
                : 'Sistemas Degradados';
        pill.className = `system-status-pill ${health.status}`;
    },

    async loadRealActivity(): Promise<void> {
        if (!this.session) return;
        try {
            const response = await fetch(`${API_ENDPOINTS.ACTIVITY}`, {
                headers: this.authHeaders()
            });
            if (response.ok) {
                const logs = await response.json();
                this.syncService?.broadcast('SYNC_ACTIVITY', logs);
                dashboardStore.setState({ activityLogs: logs });
            }
        } catch (e) {
            console.error('[Home] Error loading activity:', e);
            const logContainer = document.getElementById('home-activity-logs');
            if (logContainer)
                logContainer.innerHTML =
                    '<div class="log-placeholder text-danger">Error al conectar con el feed de actividad.</div>';
        }
    },

    renderActivity(logs: ActivityLog[]): void {
        const logContainer = document.getElementById('home-activity-logs');
        if (!logContainer) return;
        logContainer.innerHTML = '';

        if (!logs || logs.length === 0) {
            logContainer.classList.add('is-empty');
            logContainer.innerHTML = `
                <div class="feed-empty-state">
                    <span class="empty-msg">esperando actividad...</span>
                    <span class="empty-cursor">_</span>
                </div>
            `;
            return;
        }
        logContainer.classList.remove('is-empty');

        const today = new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long'
        });
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long'
        });
        let lastDateLabel = '';

        logs.forEach((log) => {
            const logDate = new Date(log.timestamp);
            const dateLabel = logDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long'
            });

            if (dateLabel !== lastDateLabel) {
                lastDateLabel = dateLabel;
                const dateDivider = document.createElement('div');
                dateDivider.className = 'log-date-divider';
                const displayLabel =
                    dateLabel === today ? 'Hoy' : dateLabel === yesterday ? 'Ayer' : dateLabel;
                dateDivider.textContent = displayLabel;
                logContainer.appendChild(dateDivider);
            }

            const time = logDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const logElement = document.createElement('div');
            logElement.className = 'log-entry';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = `[${time}]`;

            const msgSpan = document.createElement('span');
            msgSpan.className = 'log-msg';
            msgSpan.textContent = log.action;

            logElement.appendChild(timeSpan);
            logElement.appendChild(msgSpan);
            logContainer.appendChild(logElement);
        });
    },

    async loadRealStats(): Promise<void> {
        if (!this.session) return;
        try {
            const response = await fetch(`${API_ENDPOINTS.ANALYTICS}`, {
                headers: this.authHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.syncService?.broadcast('SYNC_STATS', data);
                dashboardStore.setState({ stats: data });
            }
        } catch (e) {
            console.error('[Home] Error loading stats:', e);
        }
    },

    renderStats(data: StatsData): void {
        const todayRequests = data.todayRequests || 0;
        const successRate = data.rawSuccessRate || 0;
        const avgLatencyMs = data.avgLatencyMs || 0;

        const reqEl = document.getElementById('home-stat-requests');
        const successEl = document.getElementById('home-stat-success');
        const latencyEl = document.getElementById('home-stat-latency');

        if (reqEl) {
            if (this.lastStats.todayRequests !== todayRequests) {
                UI.animateValue(reqEl, null, todayRequests);
                this.lastStats.todayRequests = todayRequests;
            } else {
                reqEl.textContent = todayRequests.toLocaleString();
            }
        }

        if (successEl) {
            if (this.lastStats.successRate !== successRate) {
                UI.animateValue(successEl, null, successRate, 1500, '%');
                this.lastStats.successRate = successRate;
            } else {
                successEl.textContent = `${successRate}%`;
            }
        }

        if (latencyEl) {
            if (this.lastStats.latency !== avgLatencyMs) {
                const unit = `ms <span class="stat-unit-alt">(${(avgLatencyMs / 1000).toFixed(1)}s)</span>`;
                UI.animateValue(latencyEl, null, avgLatencyMs, 1500, unit);
                this.lastStats.latency = avgLatencyMs;
            } else if (avgLatencyMs === 0) {
                latencyEl.innerHTML = '0ms <span class="stat-unit-alt">(0.0s)</span>';
            }
        }
    }
};
