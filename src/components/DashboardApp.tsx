import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardContent } from '@/components/views/DashboardContent';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { OnlineStatusMonitor } from '@/components/ui/OnlineStatusMonitor';
import { LoginDisclaimerModal } from '@/components/ui/LoginDisclaimerModal';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { useSession } from '@/hooks/useSession';
import { AppLogo } from '@/components/ui/AppLogo';
import { DashboardSessionSkeleton } from '@/components/ui/Skeleton';
import { logout } from '@/lib/auth';
import { initSpeedInsights } from '@/lib/speedInsights';
import { initGlobalErrorLogging } from '@/lib/logError';
import { parseTabFromUrl, setTabInUrl } from '@/lib/dashboardTabUrl';
import { card, fadeIn } from '@/lib/tw';
import type { DashboardTab } from '@/lib/config';

export function DashboardApp() {
    return (
        <ToastProvider>
            <Toaster theme="dark" richColors position="bottom-right" />
            <SessionProvider requireAuth>
                <DashboardAppShell />
            </SessionProvider>
        </ToastProvider>
    );
}

function DashboardAppShell() {
    const { session, loading, authenticated } = useSession();
    const [tab, setTabState] = useState<DashboardTab>(() => parseTabFromUrl());
    const [disclaimerOpen, setDisclaimerOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const setTab = useCallback((next: DashboardTab) => {
        setTabState(next);
        setTabInUrl(next);
    }, []);

    useEffect(() => {
        initGlobalErrorLogging();
        initSpeedInsights();
    }, []);

    useEffect(() => {
        const syncFromUrl = () => setTabState(parseTabFromUrl());
        window.addEventListener('popstate', syncFromUrl);
        window.addEventListener('hashchange', syncFromUrl);
        return () => {
            window.removeEventListener('popstate', syncFromUrl);
            window.removeEventListener('hashchange', syncFromUrl);
        };
    }, []);

    // Canonicaliza ?tab=legacy → #tab al cargar (sin perder otros query params).
    useEffect(() => {
        setTabInUrl(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
    }, []);

    if (loading) {
        return <DashboardSessionSkeleton />;
    }

    if (!authenticated || !session) {
        // SessionProvider se encarga de redirigir a '/' si requireAuth es true,
        // así que mientras el navegador cambia de página, mostramos el skeleton.
        return <DashboardSessionSkeleton />;
    }

    return (
        <>
            <OnlineStatusMonitor />
            <div id="dashboard-page" className="flex min-h-full flex-1 flex-col bg-[#09090b]">
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
        </>
    );
}
