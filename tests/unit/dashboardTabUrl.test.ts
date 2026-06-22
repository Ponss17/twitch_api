import { describe, expect, it } from '@jest/globals';
import { isDashboardTab, parseTabFromUrl } from '../../src/lib/dashboardTabUrl';

describe('dashboardTabUrl', () => {
    it('parses valid tab from hash', () => {
        expect(parseTabFromUrl('', '#clips')).toBe('clips');
        expect(parseTabFromUrl('', '#shoutout')).toBe('shoutout');
        expect(parseTabFromUrl('', '#invalid')).toBe('home');
        expect(parseTabFromUrl('', '')).toBe('home');
    });

    it('parses legacy ?tab= query when hash is absent', () => {
        expect(parseTabFromUrl('?tab=clips', '')).toBe('clips');
        expect(parseTabFromUrl('?tab=invalid', '')).toBe('home');
    });

    it('prefers hash over legacy query', () => {
        expect(parseTabFromUrl('?tab=clips', '#shoutout')).toBe('shoutout');
    });

    it('validates tab names', () => {
        expect(isDashboardTab('profile')).toBe(true);
        expect(isDashboardTab('nope')).toBe(false);
        expect(isDashboardTab(null)).toBe(false);
    });
});
