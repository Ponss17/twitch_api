import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/features/dashboard/layout/Sidebar';
import { DashboardHeader } from '@/features/dashboard/layout/DashboardHeader';
import { DashboardContent } from '@/features/dashboard/DashboardContent';
import { ToastProvider, AppToaster, useToast } from '@/shared/ui/ToastProvider';
import { OnlineStatusMonitor } from '@/shared/ui/OnlineStatusMonitor';
import { VerifyingSessionModal } from '@/shared/ui/VerifyingSessionModal';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import { useSession, useRequiredSession } from '@/core/session/useSession';
import { DashboardSessionSkeleton } from '@/shared/ui/Skeleton';
import { logout, shouldShowDashboardSplash, clearDashboardSplashFlags } from '@/core/api/auth';
import { DASHBOARD_DATA_READY_EVENT } from '@/features/dashboard/lib/dashboardPanelEvents';
import { initGlobalErrorLogging } from '@/core/logging/logError';
import { resolveDashboardTab, setTabInUrl } from '@/features/dashboard/lib/dashboardTabUrl';
import { persistPanelReturnPath } from '@/core/config/paths';
import { fadeIn } from '@/core/utils/tw';
import type { DashboardTab } from '@/core/config/config';
import { DashboardPanelProvider } from '@/features/dashboard/providers/DashboardPanelProvider';
import { I18nProvider } from '@/core/i18n/I18nContext';
import { ThemeEasterEggs } from '@/features/dashboard/easterEggs/ThemeEasterEggs';

function DashboardPanelShell({
    tab,
    onNavigate
}: {
    tab: DashboardTab;
    onNavigate: (next: DashboardTab) => void;
}) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const prioritySync = tab === 'home' || tab === 'analytics';

    return (
        <DashboardPanelProvider
            active
            prioritySync={prioritySync}
            session={session}
            showToast={showToast}
        >
            <DashboardContent tab={tab} onNavigate={onNavigate} />
        </DashboardPanelProvider>
    );
}

export function DashboardApp() {
    return (
        <I18nProvider>
            <ToastProvider>
                <AppToaster />
                <SessionProvider requireAuth>
                    <ThemeEasterEggs />
                    <DashboardAppShell />
                </SessionProvider>
            </ToastProvider>
        </I18nProvider>
    );
}

function DashboardAppShell() {
    const { session, loading, authenticated } = useSession();
    const userId = session?.userId;
    const [tab, setTabState] = useState<DashboardTab>(() => resolveDashboardTab());
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [splashOpen, setSplashOpen] = useState(() => shouldShowDashboardSplash());
    const [splashDone, setSplashDone] = useState(false);

    const setTab = useCallback(
        (next: DashboardTab) => {
            setTabState(next);
            setTabInUrl(next, { userId });
            persistPanelReturnPath();
        },
        [userId]
    );

    useEffect(() => {
        initGlobalErrorLogging();
        // Warm-up ping: despierta la función serverless de Vercel en segundo plano
        // para que los primeros comandos del usuario no sufran cold start.
        void (async () => {
            try {
                await fetch('/health', { method: 'GET' });
            } catch {
                /* silencioso */
            }
        })();
    }, []);

    useEffect(() => {
        const syncFromUrl = () => {
            setTabState(resolveDashboardTab(undefined, undefined, undefined, userId));
            persistPanelReturnPath();
        };
        window.addEventListener('popstate', syncFromUrl);
        window.addEventListener('hashchange', syncFromUrl);
        return () => {
            window.removeEventListener('popstate', syncFromUrl);
            window.removeEventListener('hashchange', syncFromUrl);
        };
    }, [userId]);

    // Canonicaliza URL (path-based) y migra hash/?tab= legacy al montar
    useEffect(() => {
        const resolved = resolveDashboardTab(undefined, undefined, undefined, userId);
        setTabState(resolved);
        setTabInUrl(resolved, { replace: true, userId });
        persistPanelReturnPath();
    }, [userId]);

    // Escuchar cuando el panel de Inicio cargó datos
    useEffect(() => {
        if (!splashOpen) return;

        const startTime = Date.now();
        let readyTimer: ReturnType<typeof setTimeout> | null = null;

        const onReady = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 800 - elapsed);
            if (readyTimer) clearTimeout(readyTimer);
            readyTimer = setTimeout(() => setSplashDone(true), remaining);
        };
        window.addEventListener(DASHBOARD_DATA_READY_EVENT, onReady);

        const fallback = setTimeout(() => setSplashDone(true), 15000);

        return () => {
            window.removeEventListener(DASHBOARD_DATA_READY_EVENT, onReady);
            if (readyTimer) clearTimeout(readyTimer);
            clearTimeout(fallback);
        };
    }, [splashOpen]);

    const handleSplashExited = useCallback(() => {
        setSplashOpen(false);
        setSplashDone(false);
        clearDashboardSplashFlags();
    }, []);

    if (loading && !splashOpen) {
        return <DashboardSessionSkeleton tab={tab} />;
    }

    if (!loading && (!authenticated || !session)) {
        return <DashboardSessionSkeleton tab={tab} />;
    }

    const dashboardReady = !loading && authenticated && !!session;

    return (
        <>
            <OnlineStatusMonitor />

            <VerifyingSessionModal
                open={splashOpen}
                done={splashDone}
                onExited={handleSplashExited}
            />

            {loading && splashOpen && (
                <div className="min-h-screen bg-bg-main" aria-hidden />
            )}

            {dashboardReady && (
                <div
                    id="dashboard-page"
                    className={`flex min-h-full flex-1 flex-col bg-bg-main transition-[filter,opacity] duration-300 ${splashOpen && !splashDone ? 'pointer-events-none opacity-50 blur-[2px]' : ''
                        }`}
                >
                    <Sidebar
                        active={tab}
                        onChange={setTab}
                        mobileOpen={mobileMenuOpen}
                        onClose={() => setMobileMenuOpen(false)}
                    />

                    <div className="flex min-h-0 flex-1 flex-col lg:ml-[240px]">
                        <DashboardHeader
                            tab={tab}
                            onSettings={() => setTab('settings')}
                            onLogout={logout}
                            onMenuToggle={() => setMobileMenuOpen((open) => !open)}
                            mobileMenuOpen={mobileMenuOpen}
                        />

                        <main className="flex flex-1 flex-col overflow-y-auto py-5">
                            <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 md:px-8 lg:px-12 xl:px-16">
                                <div className={fadeIn}>
                                    <DashboardPanelShell tab={tab} onNavigate={setTab} />
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </>
    );
}
