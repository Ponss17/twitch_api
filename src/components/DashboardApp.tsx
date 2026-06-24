import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardContent } from '@/components/views/DashboardContent';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { OnlineStatusMonitor } from '@/components/ui/OnlineStatusMonitor';
import { VerifyingSessionModal } from '@/components/ui/VerifyingSessionModal';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { useSession } from '@/hooks/useSession';
import { DashboardSessionSkeleton } from '@/components/ui/Skeleton';
import { logout } from '@/lib/auth';

import { initGlobalErrorLogging } from '@/lib/logError';
import { parseTabFromUrl, setTabInUrl } from '@/lib/dashboardTabUrl';
import { fadeIn } from '@/lib/tw';
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Splash modal: se muestra si venimos de la Landing (bandera en sessionStorage)
    const [splashOpen, setSplashOpen] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('dashboard_splash') === '1';
    });
    const [splashDone, setSplashDone] = useState(false);

    const setTab = useCallback((next: DashboardTab) => {
        setTabState(next);
        setTabInUrl(next);
    }, []);

    useEffect(() => {
        initGlobalErrorLogging();
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

    // Canonicaliza ?tab=legacy → #tab al cargar
    useEffect(() => {
        setTabInUrl(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
    }, []);

    // Escuchar cuando el Home ya cargó los datos
    useEffect(() => {
        if (!splashOpen) return;

        const startTime = Date.now();
        const onReady = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 2000 - elapsed); // Asegurar al menos 2 segundos de animación
            setTimeout(() => setSplashDone(true), remaining);
        };
        window.addEventListener('home:data-ready', onReady);

        // Safety: si el evento nunca llega (error de red, etc.), cerrar el modal después de 6s
        const fallback = setTimeout(() => setSplashDone(true), 6000);

        return () => {
            window.removeEventListener('home:data-ready', onReady);
            clearTimeout(fallback);
        };
    }, [splashOpen]);

    const handleSplashExited = useCallback(() => {
        setSplashOpen(false);
        setSplashDone(false);
        sessionStorage.removeItem('dashboard_splash');
    }, []);

    if (loading) {
        return <DashboardSessionSkeleton />;
    }

    if (!authenticated || !session) {
        // SessionProvider se encarga de redirigir a '/' si requireAuth es true
        return <DashboardSessionSkeleton />;
    }

    return (
        <>
            <OnlineStatusMonitor />

            {/* Splash modal de bienvenida (solo al llegar desde la Landing) */}
            <VerifyingSessionModal
                open={splashOpen}
                done={splashDone}
                onExited={handleSplashExited}
            />

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
