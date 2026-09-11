import { useEffect } from 'react';
import type { DashboardTab } from '@/core/config/config';
import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { AppLogo } from '@/shared/ui/AppLogo';
import { OnboardingSpotlight } from './OnboardingSpotlight';
import { useDashboardOnboarding } from './useDashboardOnboarding';

interface DashboardOnboardingProps {
    enabled: boolean;
    tab: DashboardTab;
    onNavigate: (tab: DashboardTab) => void;
    onOpenMobile: () => void;
    onCloseMobile: () => void;
}

export function DashboardOnboarding({
    enabled,
    tab,
    onNavigate,
    onOpenMobile,
    onCloseMobile
}: DashboardOnboardingProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const oT = t.home.onboarding;
    const tour = useDashboardOnboarding(session.userId, enabled);

    useEffect(() => {
        if (tour.phase !== 'tour' || !tour.step) return;
        if (tab !== tour.step.tab) onNavigate(tour.step.tab);
        if (tour.step.openSidebar) onOpenMobile();
        else onCloseMobile();
    }, [tour.phase, tour.step, tab, onNavigate, onOpenMobile, onCloseMobile]);

    if (tour.phase === 'welcome') {
        return (
            <div
                className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-welcome-title"
            >
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" aria-hidden onClick={tour.dismiss} />

                <div className="relative w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-modal px-6 pb-6 pt-8 text-center shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
                    <AppLogo
                        className="mx-auto mb-4 h-16 w-16 text-primary"
                        aria-hidden
                    />

                    <h2
                        id="onboarding-welcome-title"
                        className="text-[1.25rem] font-bold leading-snug tracking-tight text-text-main"
                    >
                        {oT.welcomeTitle}
                    </h2>

                    <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-text-muted">
                        {oT.welcomeBody}
                    </p>

                    <button
                        id="onboarding-start-tour"
                        type="button"
                        onClick={tour.startTour}
                        className="mt-6 w-full rounded-xl bg-primary px-5 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-primary/90 active:scale-[0.97]"
                    >
                        {oT.start}
                    </button>

                    <button
                        id="onboarding-skip"
                        type="button"
                        onClick={tour.dismiss}
                        className="mt-3 text-[0.8125rem] font-medium text-text-muted transition hover:text-text-main"
                    >
                        {oT.skip}
                    </button>
                </div>
            </div>
        );
    }

    if (tour.phase === 'tour' && tour.step) {
        return (
            <OnboardingSpotlight
                key={tour.step.id}
                stepId={tour.step.id}
                selector={tour.step.target}
                stepIndex={tour.stepIndex}
                stepCount={tour.stepCount}
                onNext={tour.next}
                onBack={tour.back}
                onSkip={tour.dismiss}
            />
        );
    }

    if (tour.phase === 'done') {
        return (
            <div
                className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-done-title"
            >
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" aria-hidden onClick={tour.dismiss} />

                <div className="relative w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-modal px-6 pb-6 pt-8 text-center shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
                    <AppLogo
                        className="mx-auto mb-4 h-16 w-16 text-primary"
                        aria-hidden
                    />

                    <h2
                        id="onboarding-done-title"
                        className="text-[1.25rem] font-bold leading-snug tracking-tight text-text-main"
                    >
                        {oT.doneTitle}
                    </h2>

                    <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-text-muted">
                        {oT.doneBody}
                    </p>

                    <button
                        id="onboarding-done-close"
                        type="button"
                        onClick={tour.dismiss}
                        className="mt-6 w-full rounded-xl bg-primary px-5 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-primary/90 active:scale-[0.97]"
                    >
                        {oT.doneBtn}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
