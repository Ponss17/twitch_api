import { ONBOARDING_TOUR_STEPS, HOME_ONBOARDING_DISMISS_PREF } from '@/features/dashboard/onboarding/onboarding';

describe('dashboard onboarding tour', () => {
    test('pasos tienen target e id únicos', () => {
        const ids = ONBOARDING_TOUR_STEPS.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(HOME_ONBOARDING_DISMISS_PREF).toBe('home_onboarding_dismissed');
        const analytics = ONBOARDING_TOUR_STEPS.find((s) => s.id === 'analytics');
        expect(analytics?.target).toBe('[data-tour="analytics"]');
        expect(analytics?.tab).toBe('analytics');
    });
});
