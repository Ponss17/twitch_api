import { lazy, Suspense, useEffect, useState } from 'react';
import { appPath } from '@/core/config/paths';
import { getSession } from '@/core/auth/sessionStorage';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingUsers } from './LandingUsers';
import { LandingFeatures } from './LandingFeatures';
import { LandingFit } from './LandingFit';
import { LandingFaq } from './LandingFaq';
import { LandingResources } from './LandingResources';

const LoginDisclaimerModal = lazy(() =>
    import('@/shared/ui/LoginDisclaimerModal').then((m) => ({ default: m.LoginDisclaimerModal }))
);
const VerifyingSessionModal = lazy(() =>
    import('@/shared/ui/VerifyingSessionModal').then((m) => ({ default: m.VerifyingSessionModal }))
);

function syncSessionHint(hasSession: boolean) {
    try {
        if (hasSession) document.documentElement.setAttribute('data-lp-sess', '1');
        else document.documentElement.removeAttribute('data-lp-sess');
    } catch {
        /* ignore */
    }
}

export function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [disclaimerOpen, setDisclaimerOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [legacyReloginNotice, setLegacyReloginNotice] = useState(false);

    useEffect(() => {
        syncSessionHint(!!getSession());

        void import('@/core/api/auth').then(
            ({
                clearDashboardSplashFlags,
                runLegacyPanelSessionMigration,
                takeLegacyReloginRedirect,
                consumeLegacyReloginNotice,
                getSession: getAuthSession,
                resolveSessionFromUrl,
                markDashboardSplashForFreshLogin
            }) => {
                clearDashboardSplashFlags();
                runLegacyPanelSessionMigration();
                takeLegacyReloginRedirect();
                if (consumeLegacyReloginNotice()) {
                    setLegacyReloginNotice(true);
                }

                syncSessionHint(!!getAuthSession());

                void (async () => {
                    const params = new URLSearchParams(window.location.search);
                    const authParam = params.get('auth');

                    if (authParam) {
                        setIsVerifying(true);
                        reportSessionLoadProgress({
                            progress: 12,
                            label: 'Preparando tu panel...',
                            cached: false
                        });
                        markDashboardSplashForFreshLogin();
                        window.location.href =
                            appPath('/dashboard/') + `?auth=${encodeURIComponent(authParam)}`;
                        return;
                    }

                    const sessionParams = await resolveSessionFromUrl();
                    if (sessionParams.isNewLogin !== true) return;

                    setIsVerifying(true);
                    reportSessionLoadProgress({
                        progress: 12,
                        label: 'Preparando tu panel...',
                        cached: false
                    });
                    markDashboardSplashForFreshLogin();
                    window.location.href = appPath('/dashboard/');
                })();
            }
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        let cleanup: (() => void) | undefined;

        void import('lenis/dist/lenis.css');
        void import('lenis').then(({ default: Lenis }) => {
            if (cancelled) return;

            const lenis = new Lenis({
                duration: 1.2,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
                infinite: false
            });

            const onLenisScroll = ({ scroll }: { scroll: number }) => setScrolled(scroll > 20);
            lenis.on('scroll', onLenisScroll);

            let rafId = 0;
            const raf = (time: number) => {
                lenis.raf(time);
                rafId = requestAnimationFrame(raf);
            };
            rafId = requestAnimationFrame(raf);

            const anchorHandler = (e: Event) => {
                const anchor = e.currentTarget as HTMLAnchorElement;
                const href = anchor.getAttribute('href');
                if (!href || href === '#') return;
                e.preventDefault();
                lenis.scrollTo(href);
            };

            const anchors = document.querySelectorAll('a[href^="#"]');
            anchors.forEach((anchor) => anchor.addEventListener('click', anchorHandler));

            cleanup = () => {
                cancelAnimationFrame(rafId);
                lenis.off('scroll', onLenisScroll);
                lenis.destroy();
                anchors.forEach((anchor) => anchor.removeEventListener('click', anchorHandler));
            };
        });

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, []);

    const openLogin = () => setDisclaimerOpen(true);

    return (
        <div className="relative flex flex-1 flex-col bg-bg-main">
            <LandingHeader scrolled={scrolled} onLoginClick={openLogin} />

            <div className="relative z-[1] flex-1">
                <LandingHero legacyReloginNotice={legacyReloginNotice} onLoginClick={openLogin} />
                <LandingFeatures />
                <LandingFit />
                <LandingUsers />
                <LandingResources />
                <LandingFaq />
            </div>

            <Suspense fallback={null}>
                {disclaimerOpen ? (
                    <LoginDisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
                ) : null}
                {isVerifying ? <VerifyingSessionModal open={isVerifying} /> : null}
            </Suspense>
        </div>
    );
}
