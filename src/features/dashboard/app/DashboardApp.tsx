import { useCallback, useEffect, useLayoutEffect, useState, type AnimationEvent } from 'react';
import { Sidebar } from '@/features/dashboard/layout/Sidebar';
import { DashboardHeader } from '@/features/dashboard/layout/DashboardHeader';
import { DashboardContent } from '@/features/dashboard/DashboardContent';
import { ToastProvider, AppToaster, useToast } from '@/shared/ui/toast/ToastProvider';
import { OnlineStatusMonitor } from '@/shared/ui/OnlineStatusMonitor';
import { VerifyingSessionModal } from '@/shared/ui/modals/VerifyingSessionModal';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import { useSession, useRequiredSession } from '@/core/session/useSession';
import { DashboardSessionSkeleton } from '@/shared/ui/Skeleton';
import { logout, shouldShowDashboardSplash, clearDashboardSplashFlags } from '@/core/api/auth';
import { DASHBOARD_DATA_READY_EVENT, DASHBOARD_NAVIGATE_EVENT, type DashboardNavigateDetail } from '@/features/dashboard/lib/tabs/dashboardPanelEvents';
import { initGlobalErrorLogging } from '@/core/logging/logError';
import { resolveDashboardTab, setTabInUrl } from '@/features/dashboard/lib/tabs/dashboardTabUrl';
import { persistPanelReturnPath } from '@/core/config/paths';
import { fadeIn, SIDEBAR_WIDTH_COLLAPSED_PX, SIDEBAR_WIDTH_EXPANDED_PX, sidebarContentOffset } from '@/core/utils/tw';
import type { DashboardTab } from '@/core/config/config';
import { DashboardPanelProvider } from '@/features/dashboard/providers/DashboardPanelProvider';
import { I18nProvider } from '@/core/i18n/I18nContext';
import { ThemeEasterEggs } from '@/features/dashboard/easterEggs/ThemeEasterEggs';
import {
    readSidebarCollapsedPref,
    writeSidebarCollapsedPref
} from '@/features/dashboard/lib/ui/sidebarPrefs';
import { isToolTab } from '@/features/dashboard/lib/tabs/dashboardTabs';
import { ToolFocusProvider } from '@/features/dashboard/lib/ui/ToolFocusContext';

type ToolFocusPhase = 'off' | 'pre' | 'in' | 'on' | 'out';

function DashboardMain({
    tab,
    onNavigate,
    mobileMenuOpen,
    onMenuToggle,
    onCloseMobile,
    onSettings,
    onLogout
}: {
    tab: DashboardTab;
    onNavigate: (next: DashboardTab) => void;
    mobileMenuOpen: boolean;
    onMenuToggle: () => void;
    onCloseMobile: () => void;
    onSettings: () => void;
    onLogout: () => void | Promise<void>;
}) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const prioritySync = tab === 'home' || tab === 'analytics' || tab === 'reports';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsedPref);
    const [focusPhase, setFocusPhase] = useState<ToolFocusPhase>('off');
    const toolFocus =
        (focusPhase === 'in' || focusPhase === 'on' || focusPhase === 'out') && isToolTab(tab);
    const focusBusy = focusPhase !== 'off';

    const handleSidebarCollapsedChange = useCallback((next: boolean) => {
        setSidebarCollapsed(next);
        writeSidebarCollapsedPref(next);
    }, []);

    const enterFocusMode = useCallback(() => {
        if (focusPhase !== 'off') return;
        onCloseMobile();
        setFocusPhase('pre');
    }, [focusPhase, onCloseMobile]);

    const exitFocusMode = useCallback(() => {
        setFocusPhase((phase) => {
            if (phase === 'off' || phase === 'out') return phase;
            if (phase === 'pre') return 'off';
            return 'out';
        });
    }, []);

    const onFocusShellAnimationEnd = useCallback(
        (e: AnimationEvent<HTMLDivElement>) => {
            if (e.target !== e.currentTarget) return;
            if (focusPhase === 'pre') setFocusPhase('in');
            else if (focusPhase === 'in') setFocusPhase('on');
            else if (focusPhase === 'out') setFocusPhase('off');
        },
        [focusPhase]
    );

    useEffect(() => {
        if (focusPhase !== 'pre' && focusPhase !== 'in' && focusPhase !== 'out') return;
        const safety = window.setTimeout(() => {
            setFocusPhase((phase) => {
                if (phase === 'pre') return 'in';
                if (phase === 'in') return 'on';
                if (phase === 'out') return 'off';
                return phase;
            });
        }, 450);
        return () => window.clearTimeout(safety);
    }, [focusPhase]);

    useEffect(() => {
        if (!isToolTab(tab) && focusPhase !== 'off') {
            setFocusPhase('off');
        }
    }, [tab, focusPhase]);

    useEffect(() => {
        if (!focusBusy) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') exitFocusMode();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [focusBusy, exitFocusMode]);

    useLayoutEffect(() => {
        const width = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED_PX : SIDEBAR_WIDTH_EXPANDED_PX;
        document.documentElement.style.setProperty('--lp-sidebar-w', `${width}px`);
        return () => {
            document.documentElement.style.removeProperty('--lp-sidebar-w');
        };
    }, [sidebarCollapsed]);

    useEffect(() => {
        document.body.classList.toggle('tool-focus-mode', toolFocus);
        return () => document.body.classList.remove('tool-focus-mode');
    }, [toolFocus]);

    return (
        <DashboardPanelProvider
            active
            prioritySync={prioritySync}
            session={session}
            showToast={showToast}
        >
            <ToolFocusProvider focusMode={toolFocus} exitFocusMode={exitFocusMode}>
                <Sidebar
                    active={tab}
                    onChange={onNavigate}
                    mobileOpen={mobileMenuOpen}
                    onClose={onCloseMobile}
                    onSettings={onSettings}
                    onLogout={onLogout}
                    collapsed={sidebarCollapsed}
                    onCollapsedChange={handleSidebarCollapsedChange}
                />

                <div
                    className={`flex min-h-0 flex-1 flex-col transition-[margin-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarContentOffset}`}
                >
                    <div className={toolFocus ? 'pointer-events-none' : undefined} aria-hidden={toolFocus || undefined}>
                        <DashboardHeader
                            tab={tab}
                            onMenuToggle={onMenuToggle}
                            mobileMenuOpen={mobileMenuOpen}
                            onEnterFocusMode={
                                !focusBusy && isToolTab(tab) ? enterFocusMode : undefined
                            }
                        />
                    </div>

                    <div
                        className={
                            toolFocus
                                ? [
                                      'fixed inset-0 z-[1100] flex flex-col bg-bg-main',
                                      focusPhase === 'in'
                                          ? 'animate-tool-focus-in'
                                          : focusPhase === 'out'
                                            ? 'animate-tool-focus-out'
                                            : 'opacity-100'
                                  ].join(' ')
                                : [
                                      'relative flex min-h-0 flex-1 flex-col overflow-y-auto py-5',
                                      focusPhase === 'pre' ? 'animate-tool-focus-out' : ''
                                  ]
                                      .filter(Boolean)
                                      .join(' ')
                        }
                        onAnimationEnd={
                            focusPhase === 'pre' || toolFocus
                                ? onFocusShellAnimationEnd
                                : undefined
                        }
                    >
                        <main
                            className={
                                toolFocus
                                    ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                                    : 'flex flex-1 flex-col'
                            }
                        >
                            <div
                                className={
                                    toolFocus
                                        ? 'flex min-h-0 w-full flex-1 flex-col'
                                        : 'mx-auto w-full max-w-[1440px] flex-1 px-4 md:px-8 lg:px-12 xl:px-16'
                                }
                            >
                                <div
                                    className={
                                        toolFocus ? 'flex min-h-0 flex-1 flex-col' : fadeIn
                                    }
                                >
                                    <DashboardContent tab={tab} onNavigate={onNavigate} />
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </ToolFocusProvider>
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
        const onNavigate = (event: Event) => {
            const detail = (event as CustomEvent<DashboardNavigateDetail>).detail;
            if (!detail?.tab) return;
            setTabState(detail.tab);
            setTabInUrl(detail.tab, { userId });
            if (detail.search) {
                const url = new URL(window.location.href);
                for (const [key, value] of Object.entries(detail.search)) {
                    if (value == null || value === '') url.searchParams.delete(key);
                    else url.searchParams.set(key, value);
                }
                history.replaceState({}, '', `${url.pathname}${url.search}`);
            }
            persistPanelReturnPath();
        };
        window.addEventListener(DASHBOARD_NAVIGATE_EVENT, onNavigate);
        return () => window.removeEventListener(DASHBOARD_NAVIGATE_EVENT, onNavigate);
    }, [userId]);

    useEffect(() => {
        initGlobalErrorLogging();
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

    useEffect(() => {
        const resolved = resolveDashboardTab(undefined, undefined, undefined, userId);
        setTabState(resolved);
        setTabInUrl(resolved, { replace: true, userId });
        persistPanelReturnPath();
    }, [userId]);

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
                    className={`flex min-h-full flex-1 flex-col bg-bg-main transition-[filter,opacity] duration-300 ${
                        splashOpen && !splashDone
                            ? 'pointer-events-none opacity-50 blur-[2px]'
                            : ''
                    }`}
                >
                    <DashboardMain
                        tab={tab}
                        onNavigate={setTab}
                        mobileMenuOpen={mobileMenuOpen}
                        onMenuToggle={() => setMobileMenuOpen((open) => !open)}
                        onCloseMobile={() => setMobileMenuOpen(false)}
                        onSettings={() => setTab('settings')}
                        onLogout={logout}
                    />
                </div>
            )}
        </>
    );
}
