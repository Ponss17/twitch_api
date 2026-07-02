jest.mock('@/core/config/config', () => ({
    API_ENDPOINTS: { ACTIVITY: '/api/activity', SUMMARY: '/api/summary' }
}));

jest.mock('@/features/dashboard/lib/dashboardSummary', () => ({
    fetchDashboardSummary: jest.fn()
}));

jest.mock('@/core/api/auth', () => ({
    apiFetch: jest.fn()
}));

import { EMPTY_DASHBOARD_LIVE_STATS } from '@/features/dashboard/lib/dashboardStats';
import { loadDashboardPanelData } from '@/features/dashboard/lib/loadDashboardPanelData';
import { fetchDashboardSummary } from '@/features/dashboard/lib/dashboardSummary';
import { apiFetch } from '@/core/api/auth';

const session = { userId: 'u1', login: 'tester', token: 'tok' };

describe('loadDashboardPanelData', () => {
    beforeEach(() => jest.clearAllMocks());

    it('normaliza analytics nulos a ceros', async () => {
        (fetchDashboardSummary as jest.Mock).mockResolvedValue({ analytics: null });
        (apiFetch as jest.Mock).mockResolvedValue([]);

        const result = await loadDashboardPanelData(session);
        expect(result.analytics).toEqual(EMPTY_DASHBOARD_LIVE_STATS);
        expect(result.activity).toEqual([]);
    });

    it('lanza si fallan summary y activity', async () => {
        (fetchDashboardSummary as jest.Mock).mockRejectedValue(new Error('summary fail'));
        (apiFetch as jest.Mock).mockRejectedValue(new Error('activity fail'));

        await expect(loadDashboardPanelData(session)).rejects.toThrow('summary fail');
    });

    it('devuelve fallo parcial si solo una petición falla', async () => {
        (fetchDashboardSummary as jest.Mock).mockResolvedValue({
            analytics: { clips: 2, todayRequests: 2, rawSuccessRate: 100, avgLatencyMs: 10 }
        });
        (apiFetch as jest.Mock).mockRejectedValue(new Error('activity fail'));

        const result = await loadDashboardPanelData(session);
        expect(result.analytics.clips).toBe(2);
        expect(result.activity).toEqual([]);
        expect(result.partialFailure).toBeInstanceOf(Error);
    });
});
