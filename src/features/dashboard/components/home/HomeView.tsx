import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import type { DashboardTab } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { fetchDashboardSummary } from '@/features/dashboard/lib/dashboardSummary';
import { appPath } from '@/core/config/paths';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import { useDashboardRealtime } from '@/features/dashboard/hooks/useDashboardRealtime';
import type { DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';
import { HomeHero } from '@/features/dashboard/components/home/HomeHero';
import { HomeActivityFeed } from '@/features/dashboard/components/home/HomeActivityFeed';
import { HomeResourcesPanel } from '@/features/dashboard/components/home/HomeResourcesPanel';
import { useRequiredSession } from '@/core/session/useSession';
import { fadeIn } from '@/core/ui/tw';
import { activityEntryKey, type ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';
import { useToast } from '@/shared/ui/ToastProvider';
import { formatFetchErrorForUi, isFetchNetworkError } from '@/core/api/apiError';
import { logError } from '@/core/logging/logError';
import { AlertTriangle } from 'lucide-react';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import {
    DASHBOARD_FALLBACK_POLL_MS,
    DASHBOARD_POLL_MS,
    readPanelSyncPref,
    subscribeDashboardMutation,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';


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

const POLL_MS = DASHBOARD_POLL_MS;
const FALLBACK_POLL_MS = DASHBOARD_FALLBACK_POLL_MS;
const HEALTH_POLL_MS = 300000;

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
    const [isTabLeader, setIsTabLeader] = useState(true);
    const isRealtimeLiveRef = useRef(false);
    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const fetchPanelDataRef = useRef<
        (options?: { broadcast?: boolean; retryOnNetwork?: boolean; fresh?: boolean }) => Promise<boolean>
    >(async () => false);
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

    const fetchPanelData = useCallback(
        async (options?: { broadcast?: boolean; retryOnNetwork?: boolean; fresh?: boolean }) => {
            const sync = syncRef.current;
            if (!sync?.isActive()) return false;

            const broadcast = options?.broadcast === true && sync.getIsLeader();
            setSyncing(true);
            setError(null);
            reportSessionLoadProgress({
                progress: 70,
                label: 'Obteniendo estadísticas del panel…',
                cached: false
            });

            const loadOnce = async () => {
                const [summaryResult, activityResult] = await Promise.allSettled([
                    fetchDashboardSummary(session, undefined, { fresh: options?.fresh }),
                    apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(
                        API_ENDPOINTS.ACTIVITY,
                        session
                    )
                ]);

                if (!sync.isActive() || syncRef.current !== sync) return null;

                let analyticsRes: AnalyticsData = EMPTY_STATS;
                let activityLogs: ActivityLogItem[] = [];
                const failures: unknown[] = [];

                if (summaryResult.status === 'fulfilled') {
                    analyticsRes = summaryResult.value.analytics ?? EMPTY_STATS;
                } else {
                    failures.push(summaryResult.reason);
                }

                if (activityResult.status === 'fulfilled') {
                    const activityRes = activityResult.value;
                    activityLogs = Array.isArray(activityRes) ? activityRes : (activityRes.logs ?? []);
                } else {
                    failures.push(activityResult.reason);
                }

                if (failures.length === 2) {
                    throw failures[0];
                }

                return { analyticsRes, activityLogs, partialFailure: failures[0] };
            };

            try {
                const result = await loadOnce();
                if (!result) return false;

                const { analyticsRes, activityLogs, partialFailure } = result;

                if (broadcast) {
                    sync.broadcast('SYNC_STATS', analyticsRes);
                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                }

                setStats(analyticsRes);
                setActivity(activityLogs);
                markDataReadyRef.current();
                writePanelSyncPref(session.userId, Date.now().toString());
                reportSessionLoadProgress({
                    progress: 94,
                    label: 'Preparando tu inicio…',
                    cached: false
                });
                if (isRealtimeLiveRef.current) {
                    setSyncLabel('Realtime');
                } else {
                    countdownRef.current = Math.ceil(POLL_MS / 1000);
                    setSyncLabel(`${countdownRef.current}s`);
                }

                if (partialFailure) {
                    logError('HomeView', partialFailure, 'Carga parcial del panel');
                }

                return true;
            } catch (e) {
                if (!sync.isActive() || syncRef.current !== sync) return false;

                if (isFetchNetworkError(e) && options?.retryOnNetwork !== false) {
                    await new Promise((r) => setTimeout(r, 800));
                    if (sync.isActive() && syncRef.current === sync) {
                        try {
                            const retry = await loadOnce();
                            if (retry) {
                                const { analyticsRes, activityLogs, partialFailure } = retry;
                                if (broadcast) {
                                    sync.broadcast('SYNC_STATS', analyticsRes);
                                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                                }
                                setStats(analyticsRes);
                                setActivity(activityLogs);
                                markDataReadyRef.current();
                                setError(null);
                                if (partialFailure) {
                                    logError('HomeView', partialFailure, 'Carga parcial del panel');
                                }
                                return true;
                            }
                        } catch {
                            /* sigue al error de usuario */
                        }
                    }
                }

                logError('HomeView', e, 'Error cargando datos del panel');
                setError(formatFetchErrorForUi(e));
                return false;
            } finally {
                if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
                syncingTimerRef.current = setTimeout(() => setSyncing(false), 800);
            }
        },
        [session]
    );

    fetchPanelDataRef.current = fetchPanelData;

    const performSync = useCallback(async () => {
        const sync = syncRef.current;
        if (!sync?.getIsLeader() || !sync.isActive()) return;
        await fetchPanelData({ broadcast: true });
    }, [fetchPanelData]);

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
            if (document.visibilityState === 'hidden' || !isRealtimeLiveRef.current) return;
            void fetchHealth();
        }, HEALTH_POLL_MS);
    }, [fetchHealth]);

    const startSmartPolling = useCallback(() => {
        const sync = syncRef.current;
        if (!sync) return;

        const pollMs = isRealtimeLiveRef.current ? POLL_MS : FALLBACK_POLL_MS;
        const lastSyncRaw = readPanelSyncPref(session.userId);
        const now = Date.now();
        let countdown = Math.ceil(pollMs / 1000);

        if (lastSyncRaw) {
            const elapsed = now - parseInt(lastSyncRaw, 10);
            if (elapsed < pollMs) {
                countdown = Math.ceil((pollMs - elapsed) / 1000);
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
            if (document.visibilityState === 'hidden' || isRealtimeLiveRef.current) return;

            if (!sync.getIsLeader()) {
                setSyncLabel('Follower');
                return;
            }

            countdownRef.current -= 1;
            if (countdownRef.current <= 0) {
                void performSync();
                countdownRef.current = Math.ceil(pollMs / 1000);
            }
            setSyncLabel(`${countdownRef.current}s`);
        }, 1000);
    }, [performSync, session.userId]);

    const handleRealtimeStats = useCallback((next: DashboardLiveStats) => {
        setStats(next);
        markDataReadyRef.current();
        syncRef.current?.broadcast('SYNC_STATS', next);
    }, []);

    const handleRealtimeActivity = useCallback(
        (log: ActivityLogItem) => {
            const key = activityEntryKey(log);
            let inserted = false;
            setActivity((prev) => {
                if (prev.some((item) => activityEntryKey(item) === key)) return prev;
                inserted = true;
                return [log, ...prev].slice(0, 50);
            });
            if (inserted) markActivityHighlight(key);
        },
        [markActivityHighlight]
    );

    const handleRealtimeDisconnect = useCallback(() => {
        setSyncLabel(`${Math.ceil(FALLBACK_POLL_MS / 1000)}s`);
        void performSyncRef.current();
        startSmartPolling();
    }, [startSmartPolling]);

    const { isLive: isRealtimeLive } = useDashboardRealtime({
        id: 'home',
        active: active && isTabLeader,
        session,
        onStatsUpdate: handleRealtimeStats,
        onActivityInsert: handleRealtimeActivity,
        onDisconnect: handleRealtimeDisconnect
    });

    isRealtimeLiveRef.current = isRealtimeLive;

    useEffect(() => {
        if (isRealtimeLive) {
            setSyncLabel('Realtime');
            startHealthPolling();
        } else if (active && isTabLeader) {
            startSmartPolling();
        }
    }, [active, isRealtimeLive, isTabLeader, startHealthPolling, startSmartPolling]);

    useEffect(() => {
        return subscribeDashboardMutation(session.userId, {
            onStatsCleared: () => {
                setStats(EMPTY_STATS);
                setActivity([]);
                setError(null);
                dataReadyFiredRef.current = false;
                void fetchPanelDataRef.current({
                    broadcast: true,
                    retryOnNetwork: false,
                    fresh: true
                });
            },
            onPanelRefresh: () => {
                void fetchPanelDataRef.current({
                    broadcast: true,
                    retryOnNetwork: false,
                    fresh: true
                });
            }
        });
    }, [session.userId]);

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
            return;
        }

        const sync = new TabSyncService('dashboard_home_sync');
        syncRef.current = sync;
        const highlightTimers = highlightTimersRef.current;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            setIsTabLeader(data.isLeader);
            if (data.isLeader) {
                void performSyncRef.current();
            } else {
                setSyncLabel('Follower');
                if (!isRealtimeLiveRef.current) {
                    startSmartPolling();
                }
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => setActivity(payload as ActivityLogItem[]));
        sync.on('SYNC_STATS', (payload) => {
            setStats(payload as AnalyticsData);
            markDataReadyRef.current();
        });
        sync.on('SYNC_HEALTH', (payload) => setHealth(payload as HealthStatus));

        const onVisible = () => {
            if (
                document.visibilityState === 'visible' &&
                sync.isActive() &&
                sync.getIsLeader() &&
                !isRealtimeLiveRef.current
            ) {
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

        setIsTabLeader(sync.getIsLeader());

        // Carga inmediata en esta pestaña (no espera elección de líder ~1.5s)
        void fetchPanelDataRef.current({ broadcast: false });

        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('realtime:auth-failed', onAuthFailed);
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (healthPollRef.current) clearInterval(healthPollRef.current);
            healthPollRef.current = null;
            if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
            if (authRedirectTimerRef.current) clearTimeout(authRedirectTimerRef.current);
            for (const timer of highlightTimers.values()) {
                clearTimeout(timer);
            }
            highlightTimers.clear();
            sync.destroy();
            syncRef.current = null;
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
