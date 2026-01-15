import { UI } from '../ui.js';
import { Loader } from '../utils/loader.js';
import { Messages } from '../utils/messages.js';

export const AnalyticsModule = {
    session: null,

    async init(session) {
        await Loader.loadCSS('css/sections/analytics.css');

        this.session = session;
        this.loadAnalytics();
    },

    async loadAnalytics() {
        const statsContainer = document.getElementById('stat-clips');
        if (!statsContainer) return;

        try {
            const { apiKey, token } = this.session;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/twitch/analytics?${tokenParam}`);

            if (!res.ok) {
                throw new Error(Messages.Analytics.loadError);
            }

            const stats = await res.json();
            document.getElementById('stat-clips').textContent = stats.clips || 0;
            document.getElementById('stat-followage').textContent = stats.followage || 0;
        } catch (e) {
            console.error('Error loading analytics:', e);
            document.getElementById('stat-clips').textContent = '--';
            document.getElementById('stat-followage').textContent = '--';
        }
    }
};
