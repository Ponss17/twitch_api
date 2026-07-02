import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/features/dashboard/components/layout/Sidebar';
import { DashboardHeader } from '@/features/dashboard/components/layout/DashboardHeader';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import { ToastProvider } from '@/shared/ui/ToastProvider';
import { OnlineStatusMonitor } from '@/shared/ui/OnlineStatusMonitor';
import { VerifyingSessionModal } from '@/shared/ui/VerifyingSessionModal';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import { useSession } from '@/core/session/useSession';
import { DashboardSessionSkeleton } from '@/shared/ui/Skeleton';
import { logout, shouldShowDashboardSplash, clearDashboardSplashFlags } from '@/core/api/auth';
import { DASHBOARD_DATA_READY_EVENT } from '@/features/dashboard/lib/dashboardPanelEvents';

import { initGlobalErrorLogging } from '@/core/logging/logError';
import { resolveDashboardTab, setTabInUrl } from '@/features/dashboard/lib/dashboardTabUrl';
import { persistPanelReturnPath } from '@/core/config/paths';
import { fadeIn } from '@/core/ui/tw';
import type { DashboardTab } from '@/core/config/config';

export function DashboardApp() {
    return (
        <ToastProvider>
            <Toaster theme="dark" richColors position="bottom-right" style={{ zIndex: 3000 }} />
            <SessionProvider requireAuth>
                <DashboardAppShell />
            </SessionProvider>
        </ToastProvider>
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
        return <DashboardSessionSkeleton />;
    }

    if (!loading && (!authenticated || !session)) {
        return <DashboardSessionSkeleton />;
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
                <div className="min-h-screen bg-[#09090b]" aria-hidden />
            )}

            {dashboardReady && (
            <div
                id="dashboard-page"
                className={`flex min-h-full flex-1 flex-col bg-[#09090b] transition-[filter,opacity] duration-300 ${
                    splashOpen && !splashDone ? 'pointer-events-none opacity-50 blur-[2px]' : ''
                }`}
            >
                <Sidebar
                    active={tab}
                    onChange={setTab}
                    mobileOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />

                <main className="flex min-h-0 flex-1 flex-col lg:ml-[280px]">
                    <DashboardHeader
                        tab={tab}
                        onProfile={() => setTab('profile')}
                        onLogout={logout}
                        onMenuToggle={() => setMobileMenuOpen(true)}
                    />

                    <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-3">
                        <div className={fadeIn}>
                            <DashboardContent tab={tab} onNavigate={setTab} />
                        </div>
                    </div>
                </main>
            </div>
            )}
        </>
    );
}
