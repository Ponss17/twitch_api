import { DASHBOARD_CONFIG } from '../dashboard-config.js';
import { UI } from '../../../core/ui.js';
import { ProfileUI } from './profile.ui.js';
import { Session } from '../../../types.js';

export const ProfileAPI = {
    async syncSummary(
        session: Session | null,
        authHeaders: () => HeadersInit,
        lastData: Record<string, unknown>
    ): Promise<void> {
        if (!session) return;
        const profileTab = document.getElementById('tab-profile');
        if (profileTab) profileTab.classList.add('is-loading');

        try {
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.SUMMARY}?login=${session.login}`;
            const response = await fetch(url, {
                headers: authHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data.profile) {
                    ProfileUI.updateProfileStatsInternal(data.profile, lastData);
                    ProfileUI.updateBadgesInternal(data.profile);
                }
                if (data.analytics) {
                    ProfileUI.renderCommandStatsInternal(data.analytics, lastData);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                const msg =
                    errorData.error?.message || errorData.error || 'Error al sincronizar datos';
                UI.showToast(msg, 'error');
            }
        } catch (e) {
            console.error('[Profile] Error syncing summary:', e);
            UI.showToast('Error de conexión con el servidor', 'error');
        } finally {
            if (profileTab) {
                setTimeout(() => profileTab.classList.remove('is-loading'), 300);
            }
        }
    }
};
