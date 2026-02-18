import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';

export const HomeModule = {
    session: null as Session | null,
    isInitialized: false,

    init(session: Session): void {
        this.session = session;
        this.setupUI();
        this.isInitialized = true;
    },

    deactivate() {
        // no-op
    },

    updateValues() {
        if (this.session) {
            const heroName = document.getElementById('hero-user-name');
            if (heroName) {
                heroName.textContent = this.session.displayName || this.session.login || 'Streamer';
            }
        }
    },

    setupUI() {
        this.updateValues();
        this.loadRealActivity();
        this.loadRealStats();
        this.loadRealHealth();
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
            const response = await fetch(API_ENDPOINTS.HEALTH, {
                headers: { Authorization: `Bearer ${this.session?.token}` }
            });

            if (response.ok) {
                const health = await response.json();

                label.textContent =
                    health.status === 'operational'
                        ? 'Todos los Sistemas Operativos'
                        : 'Sistemas Degradados';
                pill.className = `system-status-pill ${health.status}`;

                const latencyEl = document.getElementById('home-stat-latency');
                if (latencyEl) {
                    latencyEl.textContent = health.latency;
                }
            }
        } catch (e) {
            console.error('[Home] Error loading health:', e);
            label.textContent = 'Error de Conexión';
            pill.className = 'system-status-pill down';
        }
    },

    async loadRealActivity(): Promise<void> {
        const logContainer = document.getElementById('home-activity-logs');
        if (!logContainer || !this.session?.token) return;

        await new Promise((r) => setTimeout(r, 600));

        try {
            const response = await fetch(`${API_ENDPOINTS.ACTIVITY}?_=${Date.now()}`, {
                headers: { Authorization: `Bearer ${this.session?.token}` }
            });

            if (response.ok) {
                const logs = (await response.json()) as { action: string; timestamp: string }[];
                logContainer.innerHTML = '';

                if (logs.length === 0) {
                    logContainer.innerHTML =
                        '<div class="log-placeholder">No hay actividad reciente registrada.</div>';
                    return;
                }

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
        if (!this.session?.token) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?_=${Date.now()}`, {
                headers: { Authorization: `Bearer ${this.session.token}` }
            });

            if (response.ok) {
                const data = await response.json();

                const todayRequests = data.todayRequests || 0;
                const successRate = data.rawSuccessRate || 0;
                const avgLatency = parseInt(data.averageLatency) || 0;

                this.animateSingleStat('home-stat-requests', todayRequests, '');
                this.animateSingleStat('home-stat-success', successRate, '%');
                this.animateSingleStat(
                    'home-stat-latency',
                    avgLatency,
                    `ms (${(avgLatency / 1000).toFixed(1)}s)`
                );
            }
        } catch (e) {
            console.error('[Home] Error loading stats:', e);
        }
    },

    animateSingleStat(id: string, target: number, suffix: string): void {
        const el = document.getElementById(id);
        if (!el) return;

        let current = 0;
        const duration = 1500;
        const step = target / (duration / 30);

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                el.textContent = `${target}${suffix}`;
                clearInterval(timer);
            } else {
                el.textContent = `${current.toFixed(suffix === '%' ? 1 : 0)}${suffix}`;
            }
        }, 30);
    }
};
