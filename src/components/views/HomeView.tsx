import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import type { DashboardTab } from '@/lib/config';
import { apiFetch } from '@/lib/auth';
import { fetchDashboardSummary } from '@/lib/dashboardSummary';
import { appPath } from '@/lib/paths';
import { TabSyncService } from '@/lib/tabSyncService';

// Lazy-loaded to avoid pulling ~178KB Supabase into the initial bundle
const loadRealtimeModule = () => import('@/lib/realtimeService');
import type { RealtimeCallbacks, RealtimeService } from '@/lib/realtimeService';
import { HomeHero } from '@/components/views/HomeHero';
import { HomeActivityFeed } from '@/components/views/HomeActivityFeed';
import { HomeResourcesPanel } from '@/components/views/HomeResourcesPanel';
import { useRequiredSession } from '@/hooks/useSession';
import { fadeIn } from '@/lib/tw';
import { activityEntryKey, type ActivityLogItem } from '@/lib/activityLogDisplay';
import { readScopedPref, writeScopedPref } from '@/lib/localPrefs';
import { useToast } from '@/components/ui/ToastProvider';
import { logError } from '@/lib/logError';
import { AlertTriangle } from 'lucide-react';
import { reportSessionLoadProgress } from '@/lib/sessionLoadProgress';


interface HealthStatus {
    status?: string;
}

interface AnalyticsData {
    todayRequests?: number;
    rawSuccessRate?: number;
    avgLatencyMs?: number;
}

interface HomeViewProps {
    onNavigate?: (tab: DashboardTab) => void;
    active?: boolean;
}

const POLL_MS = 90000;
const HEALTH_POLL_MS = 300000;
const DASHBOARD_SYNC_PREF = 'dashboard_last_sync';
const LEGACY_DASHBOARD_SYNC_KEY = 'dashboard_last_sync';

const EMPTY_STATS: AnalyticsData = {
    todayRequests: 0,
    rawSuccessRate: 0,
    avgLatencyMs: 0
};

export function HomeView({ onNavigate, active = true }: HomeViewProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [stats, setStats] = useState<AnalyticsData>(EMPTY_STATS);
    const [activity, setActivity] = useState<ActivityLogItem[]>([]);
    const [hasLiveData, setHasLiveData] = useState(false);
    const [, setHealth] = useState<{ status?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncLabel, setSyncLabel] = useState('90s');
    const [highlightKeys, setHighlightKeys] = useState<ReadonlySet<string>>(() => new Set());
    const countdownRef = useRef(90);
    const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const syncRef = useRef<TabSyncService | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const healthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const realtimeRef = useRef<RealtimeService | null>(null);
    const useRealtimeRef = useRef(false);
    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const connectRealtimeRef = useRef<() => Promise<void>>(async () => {});
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    /** Garantiza que home:data-ready solo se dispara una vez por montaje */
    const dataReadyFiredRef = useRef(false);
    /** Timer de setSyncing(false) para cancelar si el componente se desmonta */
    const syncingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const authRedirectTimerRef = useRef<number | null>(null);
    const markDataReadyRef = useRef<() => void>(() => {});

    const displayName = session.displayName ?? session.login ?? 'Streamer';

    const markDataReady = useCallback(() => {
        if (dataReadyFiredRef.current) return;
        dataReadyFiredRef.current = true;
        setHasLiveData(true);
        reportSessionLoadProgress({
            progress: 99,
            label: 'Finalizando…',
            cached: false
        });
        window.dispatchEvent(new CustomEvent('home:data-ready'));
    }, []);

    markDataReadyRef.current = markDataReady;

    const markActivityHighlight = useCallback((key: string) => {
        setHighlightKeys((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });

        const existing = highlightTimersRef.current.get(key);
        if (existing) clearTimeout(existing);

        highlightTimersRef.current.set(
            key,
            setTimeout(() => {
                highlightTimersRef.current.delete(key);
                setHighlightKeys((prev) => {
                    if (!prev.has(key)) return prev;
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }, 3000)
        );
    }, []);

    const performSync = useCallback(async () => {
        const sync = syncRef.current;
        if (!sync?.getIsLeader() || !sync.isActive()) return;
        setSyncing(true);
        reportSessionLoadProgress({
            progress: 70,
            label: 'Obteniendo estadísticas del panel…',
            cached: false
        });

        try {
            const [summaryRes, activityRes] = await Promise.all([
                fetchDashboardSummary(session),
                apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(API_ENDPOINTS.ACTIVITY, session)
            ]);

            if (!sync.isActive() || syncRef.current !== sync) return;

            const analyticsRes = summaryRes.analytics ?? {};
            const activityLogs = Array.isArray(activityRes) ? activityRes : (activityRes.logs ?? []);

            sync.broadcast('SYNC_STATS', analyticsRes);
            sync.broadcast('SYNC_ACTIVITY', activityLogs);

            setStats(analyticsRes);
            setActivity(activityLogs);
            markDataReadyRef.current();
            writeScopedPref(
                DASHBOARD_SYNC_PREF,
                session.userId,
                Date.now().toString(),
                LEGACY_DASHBOARD_SYNC_KEY
            );
            reportSessionLoadProgress({
                progress: 94,
                label: 'Preparando tu inicio…',
                cached: false
            });
            if (useRealtimeRef.current) {
                setSyncLabel('Realtime');
            } else {
                countdownRef.current = Math.ceil(POLL_MS / 1000);
                setSyncLabel(`${countdownRef.current}s`);
            }
        } catch (e) {
            logError('HomeView', e, 'Error cargando datos del panel');
            setError((prev) => prev ?? (e instanceof Error ? e.message : 'Error cargando datos'));
        } finally {
            if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
            syncingTimerRef.current = setTimeout(() => setSyncing(false), 800);
        }
    }, [session]);

    performSyncRef.current = performSync;

    const fetchHealth = useCallback(async () => {
        const sync = syncRef.current;
        if (!sync?.getIsLeader()) return;
        try {
            const healthRes = await fetch(API_ENDPOINTS.LIGHT_HEALTH).then((r) =>
                r.ok ? r.json() : { status: 'error' }
            );
            sync.broadcast('SYNC_HEALTH', healthRes);
        } catch {
            void 0;
        }
    }, []);

    const startHealthPolling = useCallback(() => {
        if (healthPollRef.current) clearInterval(healthPollRef.current);
        healthPollRef.current = setInterval(() => {
            if (document.visibilityState === 'hidden' || !useRealtimeRef.current) return;
            void fetchHealth();
        }, HEALTH_POLL_MS);
    }, [fetchHealth]);

    const startSmartPolling = useCallback(() => {
        const sync = syncRef.current;
        if (!sync) return;

        const lastSyncRaw = readScopedPref(
            DASHBOARD_SYNC_PREF,
            session.userId,
            LEGACY_DASHBOARD_SYNC_KEY
        );
        const now = Date.now();
        let countdown = Math.ceil(POLL_MS / 1000);

        if (lastSyncRaw) {
            const elapsed = now - parseInt(lastSyncRaw, 10);
            if (elapsed < POLL_MS) {
                countdown = Math.ceil((POLL_MS - elapsed) / 1000);
            } else if (sync.getIsLeader()) {
                void performSync();
            }
        } else if (sync.getIsLeader()) {
            void performSync();
        }

        countdownRef.current = countdown;
        setSyncLabel(sync.getIsLeader() ? `${countdown}s` : 'Follower');

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            if (document.visibilityState === 'hidden' || useRealtimeRef.current) return;

            if (!sync.getIsLeader()) {
                setSyncLabel('Follower');
                return;
            }

            countdownRef.current -= 1;
            if (countdownRef.current <= 0) {
                void performSync();
                countdownRef.current = Math.ceil(POLL_MS / 1000);
            }
            setSyncLabel(`${countdownRef.current}s`);
        }, 1000);
    }, [performSync, session.userId]);

    const connectRealtime = useCallback(async () => {
        const sync = syncRef.current;
        if (!sync?.getIsLeader()) return;

        const { RealtimeServiceFactory, isRealtimeInCooldown } = await loadRealtimeModule();

        if (isRealtimeInCooldown()) {
            useRealtimeRef.current = false;
            startSmartPolling();
            return;
        }

        const callbacks: RealtimeCallbacks = {
            onStatsUpdate: (next: AnalyticsData) => {
                setStats(next);
                markDataReadyRef.current();
            },
            onActivityInsert: (log: ActivityLogItem) => {
                const key = activityEntryKey(log);
                let inserted = false;
                setActivity((prev) => {
                    if (prev.some((item) => activityEntryKey(item) === key)) return prev;
                    inserted = true;
                    return [log, ...prev].slice(0, 50);
                });
                if (inserted) markActivityHighlight(key);
            }
        };

        if (realtimeRef.current) {
            realtimeRef.current.setCallbacks(callbacks);
            const resumed = await realtimeRef.current.resume();
            if (resumed) {
                useRealtimeRef.current = true;
                setSyncLabel('Realtime');
                startHealthPolling();
                await performSync();
                return;
            }
            useRealtimeRef.current = false;
            startSmartPolling();
            return;
        }

        try {
            const service = RealtimeServiceFactory.getInstance(session, callbacks);
            realtimeRef.current = service;

            const connected = await service.connect(() => {
                useRealtimeRef.current = false;
                setSyncLabel(`${Math.ceil(POLL_MS / 1000)}s`);
                startSmartPolling();
            });

            if (connected) {
                useRealtimeRef.current = true;
                setSyncLabel('Realtime');
                startHealthPolling();
                await performSync();
            } else {
                useRealtimeRef.current = false;
                RealtimeServiceFactory.destroy();
                realtimeRef.current = null;
                startSmartPolling();
            }
        } catch {
            useRealtimeRef.current = false;
            RealtimeServiceFactory.destroy();
            realtimeRef.current = null;
            startSmartPolling();
        }
    }, [markActivityHighlight, performSync, session, startHealthPolling, startSmartPolling]);

    connectRealtimeRef.current = connectRealtime;

    useEffect(() => {
        if (!active) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (healthPollRef.current) clearInterval(healthPollRef.current);
            healthPollRef.current = null;
            if (syncRef.current) {
                syncRef.current.destroy();
                syncRef.current = null;
            }
            void loadRealtimeModule().then(({ RealtimeServiceFactory }) => {
                RealtimeServiceFactory.destroy();
                realtimeRef.current = null;
                useRealtimeRef.current = false;
            });
            return;
        }

        const sync = new TabSyncService('dashboard_home_sync');
        syncRef.current = sync;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            if (data.isLeader) {
                void performSyncRef.current();
                void connectRealtimeRef.current();
            } else {
                void loadRealtimeModule().then(({ RealtimeServiceFactory }) => {
                    RealtimeServiceFactory.destroy();
                    realtimeRef.current = null;
                    useRealtimeRef.current = false;
                    setSyncLabel('Follower');
                    startSmartPolling();
                });
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => setActivity(payload as ActivityLogItem[]));
        sync.on('SYNC_STATS', (payload) => {
            setStats(payload as AnalyticsData);
            markDataReadyRef.current();
        });
        sync.on('SYNC_HEALTH', (payload) => setHealth(payload as HealthStatus));

        const onVisible = () => {
            if (document.visibilityState === 'visible' && sync.isActive() && sync.getIsLeader() && !useRealtimeRef.current) {
                void performSyncRef.current();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        const onAuthFailed = () => {
            showToastRef.current('Sesión expirada. Redirigiendo al login...', 'error');
            authRedirectTimerRef.current = window.setTimeout(() => {
                window.location.href = appPath('/');
            }, 2000);
        };
        window.addEventListener('realtime:auth-failed', onAuthFailed);

        // Fire data fetch immediately so the user sees stats ASAP,
        // while realtime connects in background
        void performSyncRef.current();
        void connectRealtimeRef.current();

        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('realtime:auth-failed', onAuthFailed);
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (healthPollRef.current) clearInterval(healthPollRef.current);
            healthPollRef.current = null;
            if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
            if (authRedirectTimerRef.current) clearTimeout(authRedirectTimerRef.current);
            for (const timer of highlightTimersRef.current.values()) {
                clearTimeout(timer);
            }
            highlightTimersRef.current.clear();
            sync.destroy();
            syncRef.current = null;
            void loadRealtimeModule().then(({ RealtimeServiceFactory }) => {
                RealtimeServiceFactory.destroy();
                realtimeRef.current = null;
                useRealtimeRef.current = false;
            });
            // Resetear el guard para que si el componente vuelve a montarse dispare el evento de nuevo
            dataReadyFiredRef.current = false;
        };
    }, [active, startSmartPolling]);

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-[#0f0f11] p-6 text-red-400">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const latencyMs = stats.avgLatencyMs ?? 0;

    return (
        <div className={fadeIn}>
            <HomeHero
                displayName={displayName}
                todayRequests={stats.todayRequests ?? 0}
                successRate={stats.rawSuccessRate ?? 0}
                latencyMs={latencyMs}
                isLoading={!hasLiveData}
            />

            <div className="grid grid-cols-1 items-stretch gap-6 min-[1001px]:grid-cols-[1fr_300px]">
                <HomeActivityFeed
                    activity={activity}
                    syncing={syncing}
                    syncLabel={syncLabel}
                    isLoading={!hasLiveData}
                    isLive={syncLabel === 'Realtime'}
                    highlightKeys={highlightKeys}
                />
                <HomeResourcesPanel onNavigate={onNavigate} />
            </div>
        </div>
    );
}
