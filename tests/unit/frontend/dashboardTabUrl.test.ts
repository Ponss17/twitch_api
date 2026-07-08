import { describe, expect, it, beforeEach } from '@jest/globals';
import {
    getDashboardBasePath,
    isDashboardTab,
    parseTabFromPathname,
    resolveDashboardTab
} from '@/features/dashboard/lib/dashboardTabUrl';

const BASE = getDashboardBasePath();

describe('dashboardTabUrl', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('validates tab names', () => {
        expect(isDashboardTab('settings')).toBe(true);
        expect(isDashboardTab('stats')).toBe(false);
        expect(isDashboardTab('nope')).toBe(false);
        expect(isDashboardTab(null)).toBe(false);
    });

    it('ignores removed stats tab in pathname', () => {
        expect(parseTabFromPathname(`${BASE}/stats`)).toBeNull();
    });

    it('parses tab from pathname', () => {
        expect(parseTabFromPathname(`${BASE}/`)).toBe('home');
        expect(parseTabFromPathname(BASE)).toBe('home');
        expect(parseTabFromPathname(`${BASE}/roulette`)).toBe('roulette');
        expect(parseTabFromPathname(`${BASE}/unknown`)).toBeNull();
    });

    it('restores last tab per user on bare dashboard', () => {
        localStorage.setItem('twitch_dashboard_last_tab_user-1', 'roulette');
        expect(resolveDashboardTab('', '', `${BASE}/`, 'user-1')).toBe('roulette');
        expect(resolveDashboardTab('', '', `${BASE}/`, 'user-2')).toBe('home');
    });
});
