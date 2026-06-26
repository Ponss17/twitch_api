import { describe, expect, it, beforeEach } from '@jest/globals';
import { getDashboardBasePath, resolveDashboardTab } from '@/lib/dashboardTabUrl';

const BASE = getDashboardBasePath();

describe('dashboardTabUrl (scoped prefs)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('restores last tab per user on bare dashboard', () => {
        localStorage.setItem('twitch_dashboard_last_tab_user-1', 'roulette');
        expect(resolveDashboardTab('', '', `${BASE}/`, 'user-1')).toBe('roulette');
        expect(resolveDashboardTab('', '', `${BASE}/`, 'user-2')).toBe('home');
    });
});
