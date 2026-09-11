import type { DashboardTab } from '@/core/config/config';

/** Primera visita al panel — skip o tour completado. */
export const HOME_ONBOARDING_DISMISS_PREF = 'home_onboarding_dismissed';

export type OnboardingStepId =
    | 'sidebar-nav'
    | 'home-hero'
    | 'home-activity'
    | 'home-resources'
    | 'followage'
    | 'analytics';

export type OnboardingTourStep = {
    id: OnboardingStepId;
    target: string;
    tab: DashboardTab;
    openSidebar?: boolean;
};

export const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
    { id: 'sidebar-nav',    target: '[data-tour="sidebar-nav"]',    tab: 'home', openSidebar: true },
    { id: 'home-hero',      target: '[data-tour="home-hero"]',      tab: 'home' },
    { id: 'home-activity',  target: '[data-tour="home-activity"]',  tab: 'home' },
    { id: 'home-resources', target: '[data-tour="home-resources"]', tab: 'home' },
    { id: 'analytics',      target: '[data-tour="sidebar-nav"]',    tab: 'analytics', openSidebar: true },
    { id: 'followage',      target: '[data-tour="command-generator"]', tab: 'followage' }
];
