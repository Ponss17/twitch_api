import { describe, expect, it } from '@jest/globals';
import {
    getDashboardBasePath,
    isDashboardTab,
    parseTabFromPathname,
    parseTabFromUrl,
    resolveDashboardTab
} from '../../src/lib/dashboardTabUrl';

const BASE = getDashboardBasePath();

describe('dashboardTabUrl', () => {
    it('validates tab names', () => {
        expect(isDashboardTab('profile')).toBe(true);
        expect(isDashboardTab('nope')).toBe(false);
        expect(isDashboardTab(null)).toBe(false);
    });

    it('parses tab from pathname', () => {
        expect(parseTabFromPathname(`${BASE}/`)).toBe('home');
        expect(parseTabFromPathname(BASE)).toBe('home');
        expect(parseTabFromPathname(`${BASE}/followage`)).toBe('followage');
        expect(parseTabFromPathname(`${BASE}/trends`)).toBe('trends');
        expect(parseTabFromPathname(`${BASE}/invalid`)).toBe(null);
        expect(parseTabFromPathname('/api/twitch/docs')).toBe(null);
    });

    it('prefers pathname over hash and query', () => {
        expect(resolveDashboardTab('', '#clips', `${BASE}/followage`)).toBe('followage');
        expect(resolveDashboardTab('?tab=clips', '#shoutout', `${BASE}/trends`)).toBe('trends');
    });

    it('parses valid tab from hash (legacy)', () => {
        expect(parseTabFromUrl('', '#clips', `${BASE}/`)).toBe('clips');
        expect(parseTabFromUrl('', '#shoutout', `${BASE}/`)).toBe('shoutout');
        expect(parseTabFromUrl('', '#invalid', `${BASE}/`)).toBe('home');
    });

    it('parses legacy ?tab= query when path is bare dashboard', () => {
        expect(parseTabFromUrl('?tab=clips', '', `${BASE}/`)).toBe('clips');
        expect(parseTabFromUrl('?tab=invalid', '', `${BASE}/`)).toBe('home');
    });

    it('prefers hash over legacy query on bare dashboard', () => {
        expect(parseTabFromUrl('?tab=clips', '#shoutout', `${BASE}/`)).toBe('shoutout');
    });
});
