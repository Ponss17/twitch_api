import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';
import { Loader } from '../../shared/utils/loader.js';
import { BaseModule } from '../../shared/utils/baseModule.js';
import { TabSyncService } from '../../shared/utils/tabSyncService.js';

interface HealthStatus {
    status: string;
}

interface ActivityLog {
    action: string;
    timestamp: string;
}

interface StatsData {
    todayRequests?: number;
    rawSuccessRate?: number;
    avgLatencyMs?: number;
}

export const HomeModule = {
    ...BaseModule,
    session: null as Session | null,
    isInitialized: false,
    pollInterval: null as ReturnType<typeof setInterval> | null,
    visibilityHandler: null as (() => void) | null,
    syncService: null as TabSyncService | null,
    countdown: 30,
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

        this.startSmartPolling();
    },

    setupSyncListeners(): void {
        if (!this.syncService) return;

        this.syncService.on('LEADER_CHANGED', (payload: unknown) => {
            const data = payload as { isLeader: boolean };
            const syncEl = document.getElementById('home-sync-indicator');
            if (syncEl) {
                syncEl.textContent = data.isLeader ? 'Leader' : 'Follower';
            }
            if (data.isLeader) {
                this.performSync();
            }
        });

        this.syncService.on('SYNC_ACTIVITY', (payload: unknown) =>
            this.renderActivity(payload as ActivityLog[])
        );
        this.syncService.on('SYNC_STATS', (payload: unknown) =>
            this.renderStats(payload as StatsData)
        );
        this.syncService.on('SYNC_HEALTH', (payload: unknown) =>
            this.renderHealth(payload as HealthStatus)
        );
    },

    deactivate(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }
        if (this.syncService) {
            this.syncService.destroy();
            this.syncService = null;
        }
    },

    startSmartPolling(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        const pollMs = 30000;

        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                this.countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                this.countdown = 30;
                if (this.syncService?.getIsLeader()) this.performSync();
            }
        } else {
            this.countdown = 30;
            if (this.syncService?.getIsLeader()) this.performSync();
        }

        this.updateSyncIndicator();

        this.pollInterval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            this.countdown--;
            if (this.countdown <= 0) {
                if (this.syncService?.getIsLeader()) this.performSync();
                this.countdown = 30;
            }
            this.updateSyncIndicator();
        }, 1000);

        this.visibilityHandler = () => {
            if (document.visibilityState === 'visible' && this.countdown <= 0) {
                if (this.syncService?.getIsLeader()) this.performSync();
                this.countdown = 30;
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
            await this.loadRealActivity();
            await new Promise((r) => setTimeout(r, 500));
            await this.loadRealStats();
            await new Promise((r) => setTimeout(r, 500));
            await this.loadRealHealth();
        } catch (e) {
            console.error('[Home] Error en sync escalonado:', e);
        }

        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    },

    updateSyncIndicator(): void {
        const syncEl = document.getElementById('home-sync-indicator');
        if (!syncEl) return;
        if (!syncEl.classList.contains('syncing') && this.syncService) {
            syncEl.textContent = this.syncService.getIsLeader() ? 'Leader' : 'Follower';
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
        const pill = document.getElementById('home-health-pill');
        const label = pill?.querySelector('.status-label');
        if (!pill || !label || !this.session) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.HEALTH}`, {
                headers: this.authHeaders()
            });

            if (response.ok) {
                const health = await response.json();
                this.syncService?.broadcast('SYNC_HEALTH', health);
                this.renderHealth(health);
            }
        } catch (e) {
            console.error('[Home] Error loading health:', e);
            this.renderHealth({ status: 'error' });
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
        const logContainer = document.getElementById('home-activity-logs');
        if (!logContainer || !this.session) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.ACTIVITY}`, {
                headers: this.authHeaders()
            });

            if (response.ok) {
                const logs = await response.json();
                this.syncService?.broadcast('SYNC_ACTIVITY', logs);
                this.renderActivity(logs);
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

        logs.forEach((log: { action: string; timestamp: string }) => {
            const time = new Date(log.timestamp).toLocaleTimeString('es-ES', {
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
                await this.renderStats(data);
            }
        } catch (e) {
            console.error('[Home] Error loading stats:', e);
        }
    },

    async renderStats(data: StatsData): Promise<void> {
        const { UI } = await import('../../core/ui.js');

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
