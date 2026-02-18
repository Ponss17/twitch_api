import { AnalyticsMessages } from './analytics/messages.js';
import { DASHBOARD_CONFIG } from './dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';

interface AnalyticsData {
    clips: number;
    followage: number;
    so: number;
    [key: string]: number;
}

export const AnalyticsModule = {
    session: null as Session | null,
    cache: null as AnalyticsData | null,
    lastFetch: 0,
    CACHE_DURATION: 60000,
    initialized: false,

    init(session: Session): void {
        this.session = session;
        if (this.initialized) return;

        import('../../shared/utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/analytics.css');
        });
        this.initialized = true;
    },

    activate() {
        this.load();
    },

    deactivate() {},

    async load(force = false) {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        const now = Date.now();
        if (!force && this.cache && now - this.lastFetch < this.CACHE_DURATION) {
            this.render(this.cache);
            return;
        }

        if (!this.cache) {
            this.showSkeleton();
        }

        try {
            if (!this.session) return;
            const { token } = this.session;
            const res = await fetch(API_ENDPOINTS.ANALYTICS, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();

                if (data && typeof data === 'object') {
                    this.cache = data;
                    this.lastFetch = Date.now();
                    this.render(data);
                } else {
                    if (!this.cache) statsContainer.innerHTML = AnalyticsMessages.errorState;
                }
            } else {
                if (!this.cache) {
                    statsContainer.innerHTML = AnalyticsMessages.errorState;
                }
            }
        } catch (_e) {
            if (!this.cache) {
                statsContainer.innerHTML = AnalyticsMessages.errorState;
            }
        }
    },

    showSkeleton() {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 3; i++) {
            const card = document.createElement('div');
            card.className = 'stat-card skeleton-card';
            card.innerHTML = `
                <div class="stat-icon skeleton skeleton-circle" style="width: 50px; height: 50px;"></div>
                <div class="stat-info" style="flex: 1;">
                    <div class="skeleton skeleton-text" style="width: 40px; height: 28px; margin-bottom: 5px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100px; height: 16px;"></div>
                </div>
            `;
            fragment.appendChild(card);
        }
        statsContainer.innerHTML = '';
        statsContainer.appendChild(fragment);
    },

    render(data: AnalyticsData) {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        const statConfig = [
            { key: 'clips', icon: 'fa-film', label: 'Clips Creados' },
            { key: 'followage', icon: 'fa-clock', label: 'Consultas Followage' },
            { key: 'so', icon: 'fa-bullhorn', label: 'Shoutouts' }
        ];

        const fragment = document.createDocumentFragment();
        statConfig.forEach((stat, index) => {
            const value = data[stat.key] || 0;
            const card = document.createElement('div');
            card.className = `stat-card stagger-${index + 1}`;
            card.style.animation = 'fadeInSoft 0.5s ease-out forwards';
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <div class="stat-icon"><i class="fa-solid ${stat.icon}"></i></div>
                <div class="stat-info">
                    <h3 class="counter" data-target="${value}">0</h3>
                    <span>${stat.label}</span>
                </div>
            `;
            fragment.appendChild(card);
        });

        statsContainer.innerHTML = '';
        statsContainer.appendChild(fragment);

        requestAnimationFrame(() => {
            document.querySelectorAll('.counter').forEach((counter) => {
                const target = parseInt((counter as HTMLElement).dataset.target || '0');
                this.animateValue(counter as HTMLElement, 0, target, 1500);
            });
        });
    },

    animateValue(obj: HTMLElement, start: number, end: number, duration: number) {
        if (start === end) {
            obj.innerHTML = end.toString();
            return;
        }

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function: easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);

            obj.innerHTML = Math.floor(easeProgress * (end - start) + start).toString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toString();
            }
        };
        window.requestAnimationFrame(step);
    }
};
