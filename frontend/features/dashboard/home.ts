import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';
import { Loader } from '../../shared/utils/loader.js';
import { BaseModule } from '../../shared/utils/baseModule.js';

export const HomeModule = {
    ...BaseModule,
    session: null as Session | null,
    isInitialized: false,
    pollInterval: null as ReturnType<typeof setInterval> | null,
    visibilityHandler: null as (() => void) | null,
    countdown: 15,
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
        this.startSmartPolling();
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
    },

    startSmartPolling(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        const pollMs = 15000;

        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                this.countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                this.countdown = 15;
                this.performSync();
            }
        } else {
            this.countdown = 15;
            this.performSync();
        }

        this.updateSyncIndicator();

        this.pollInterval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            this.countdown--;
            if (this.countdown <= 0) {
                this.performSync();
                this.countdown = 15;
            }
            this.updateSyncIndicator();
        }, 1000);

        this.visibilityHandler = () => {
            if (document.visibilityState === 'visible' && this.countdown <= 0) {
                this.performSync();
                this.countdown = 15;
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    },

    async performSync(): Promise<void> {
        const syncEl = document.getElementById('home-sync-indicator');
        if (syncEl) syncEl.classList.add('syncing');

        localStorage.setItem('dashboard_last_sync', Date.now().toString());
        await Promise.all([this.loadRealActivity(), this.loadRealStats(), this.loadRealHealth()]);

        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    },

    updateSyncIndicator(): void {
        const syncEl = document.getElementById('home-sync-indicator');
        if (!syncEl) return;
        syncEl.textContent = 'Auto';
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

                label.textContent =
                    health.status === 'operational'
                        ? 'Todos los Sistemas Operativos'
                        : 'Sistemas Degradados';
                pill.className = `system-status-pill ${health.status}`;
            }
        } catch (e) {
            console.error('[Home] Error loading health:', e);
            label.textContent = 'Error de Conexión';
            pill.className = 'system-status-pill down';
        }
    },

    async loadRealActivity(): Promise<void> {
        const logContainer = document.getElementById('home-activity-logs');
        if (!logContainer || !this.session) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.ACTIVITY}`, {
                headers: this.authHeaders()
            });

            if (response.ok) {
                const logs = (await response.json()) as { action: string; timestamp: string }[];
                logContainer.innerHTML = '';

                if (logs.length === 0) {
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
                    logElement.innerHTML = `
                        <span class="log-time">[${time}]</span>
                        <span class="log-msg">${log.action}</span>
                    `;
                    logContainer.appendChild(logElement);
                });
            }
        } catch (e) {
            console.error('[Home] Error loading activity:', e);
            logContainer.innerHTML =
                '<div class="log-placeholder text-danger">Error al conectar con el feed de actividad.</div>';
        }
    },

    async loadRealStats(): Promise<void> {
        if (!this.session) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.ANALYTICS}`, {
                headers: this.authHeaders()
            });

            if (response.ok) {
                const data = await response.json();
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
        } catch (e) {
            console.error('[Home] Error loading stats:', e);
        }
    }
};
