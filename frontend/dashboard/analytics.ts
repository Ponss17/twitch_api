import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { Session } from '../types.js';

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

    init(session: Session) {
        this.session = session;
        import('../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/analytics.css');
        });
        this.load();
    },

    async load(force = false) {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        const now = Date.now();
        if (!force && this.cache && (now - this.lastFetch < this.CACHE_DURATION)) {
            this.render(this.cache);
            return;
        }

        if (!this.cache) {
            this.showSkeleton();
        }

        try {
            if (!this.session) return;
            const { token } = this.session;
            console.log('[Analytics] Fetching from:', API_ENDPOINTS.ANALYTICS);

            const res = await fetch(API_ENDPOINTS.ANALYTICS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('[Analytics] Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('[Analytics] Data received:', data);
                this.cache = data;
                this.lastFetch = Date.now();
                this.render(data);
            } else {
                const errorText = await res.text();
                console.error('[Analytics] Error response:', errorText);
                if (!this.cache) {
                    statsContainer.innerHTML = Messages.Analytics.errorState;
                }
            }
        } catch (e) {
            console.error('[Analytics] Fetch error:', e);
            if (!this.cache) {
                statsContainer.innerHTML = Messages.Analytics.errorState;
            }
        }
    },

    showSkeleton() {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        statsContainer.innerHTML = Array(3).fill(0).map(() => `
            <div class="stat-card skeleton-card">
                <div class="stat-icon skeleton skeleton-circle" style="width: 50px; height: 50px; border-radius: 50%;"></div>
                <div class="stat-info" style="flex: 1;">
                    <div class="skeleton skeleton-text" style="width: 40px; height: 28px; margin-bottom: 5px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100px; height: 16px;"></div>
                </div>
            </div>
        `).join('');
    },

    render(data: AnalyticsData) {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        statsContainer.innerHTML = '';

        const statConfig = [
            { key: 'clips', icon: 'fa-film', label: 'Clips Creados' },
            { key: 'followage', icon: 'fa-clock', label: 'Consultas Followage' },
            { key: 'so', icon: 'fa-bullhorn', label: 'Shoutouts' }
        ];

        statConfig.forEach(stat => {
            const value = data[stat.key] || 0;
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-icon"><i class="fa-solid ${stat.icon}"></i></div>
                <div class="stat-info">
                    <h3>${value}</h3>
                    <span>${stat.label}</span>
                </div>
            `;
            statsContainer.appendChild(card);
        });
    }
};
