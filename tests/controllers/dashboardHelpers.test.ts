import {
    flattenCachedDashboardProfile,
    isAnalyticsCacheFresh
} from '../../backend/src/features/dashboard/dashboardHelpers';

describe('isAnalyticsCacheFresh', () => {
    it('falla de forma segura si falta la revisión remota', () => {
        expect(isAnalyticsCacheFresh({ _statsRev: 4 }, -1)).toBe(false);
    });

    it('solo acepta la misma revisión monotónica', () => {
        expect(isAnalyticsCacheFresh({ _statsRev: 4 }, 4)).toBe(true);
        expect(isAnalyticsCacheFresh({ _statsRev: 3 }, 4)).toBe(false);
        expect(isAnalyticsCacheFresh({ _statsRev: 5 }, 4)).toBe(false);
    });
});

describe('flattenCachedDashboardProfile', () => {
    it('returns null for null cache', () => {
        expect(flattenCachedDashboardProfile(null)).toEqual({ profile: null, wasNested: false });
    });

    it('passes through flat profiles', () => {
        const flat = {
            login: 'losperris',
            followers: 42,
            created_at: '2018-01-01T00:00:00Z',
            broadcaster_type: 'affiliate'
        };
        expect(flattenCachedDashboardProfile(flat)).toEqual({ profile: flat, wasNested: false });
    });

    it('unwraps nested profileData wrappers from the legacy cache shape', () => {
        const nested = {
            profileData: {
                login: 'losperris',
                followers: 1200,
                created_at: '2018-01-01T00:00:00Z',
                broadcaster_type: 'affiliate',
                display_name: 'LosPerris'
            },
            limits: { role: 'user', rateLimit: 60 },
            degraded: false
        };
        const { profile, wasNested } = flattenCachedDashboardProfile(nested);
        expect(wasNested).toBe(true);
        expect(profile).toMatchObject({
            login: 'losperris',
            followers: 1200,
            created_at: '2018-01-01T00:00:00Z',
            broadcaster_type: 'affiliate',
            role: 'user',
            rateLimit: 60
        });
        expect(profile).not.toHaveProperty('profileData');
        expect(profile).not.toHaveProperty('degraded');
    });
});
