import { DASHBOARD_CONFIG } from '../dashboard-config.js';
import { Session } from '../../../types.js';

export const ProfileAPI = {
    async fetchSummary(
        session: Session | null,
        authHeaders: () => HeadersInit
    ): Promise<{ profile?: Record<string, unknown>; analytics?: Record<string, number> }> {
        if (!session) return {};

        try {
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.SUMMARY}?login=${session.login}`;
            const response = await fetch(url, {
                headers: authHeaders()
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message || errorData.error || 'Error al sincronizar datos'
                );
            }
        } catch (e) {
            console.error('[Profile] Error fetching summary:', e);
            throw e;
        }
    }
};
