import { useCallback, useState } from 'react';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { HOME_ONBOARDING_DISMISS_PREF, ONBOARDING_TOUR_STEPS } from './onboarding';

export type OnboardingPhase = 'welcome' | 'tour' | 'done' | 'off';

export function useDashboardOnboarding(userId: string | undefined, enabled: boolean) {
    const [phase, setPhase] = useState<OnboardingPhase>(() => {
        if (!enabled || !userId) return 'off';
        return readScopedPref(HOME_ONBOARDING_DISMISS_PREF, userId) === '1' ? 'off' : 'welcome';
    });
    const [stepIndex, setStepIndex] = useState(0);

    const dismiss = useCallback(() => {
        if (userId) writeScopedPref(HOME_ONBOARDING_DISMISS_PREF, userId, '1');
        setPhase('off');
        setStepIndex(0);
    }, [userId]);

    const startTour = useCallback(() => {
        setStepIndex(0);
        setPhase('tour');
    }, []);

    const next = useCallback(() => {
        setStepIndex((i) => {
            const nextIndex = i + 1;
            if (nextIndex >= ONBOARDING_TOUR_STEPS.length) {
                if (userId) writeScopedPref(HOME_ONBOARDING_DISMISS_PREF, userId, '1');
                setPhase('done');
                return i;
            }
            return nextIndex;
        });
    }, [userId]);

    const back = useCallback(() => {
        setStepIndex((i) => Math.max(0, i - 1));
    }, []);

    return {
        phase: enabled ? phase : ('off' as const),
        stepIndex,
        step: ONBOARDING_TOUR_STEPS[stepIndex],
        stepCount: ONBOARDING_TOUR_STEPS.length,
        dismiss,
        startTour,
        next,
        back
    };
}
