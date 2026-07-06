import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from 'react';
import type { Session } from '@/core/config/config';
import { appPath } from '@/core/config/paths';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import { useDashboardRealtime } from '@/features/dashboard/hooks/useDashboardRealtime';
import {
    EMPTY_DASHBOARD_LIVE_STATS,
    type DashboardLiveStats
} from '@/features/dashboard/lib/dashboardStats';
import { activityEntryKey, type ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';
import { formatFetchErrorForUi, isFetchNetworkError } from '@/core/api/apiError';
import { logError } from '@/core/logging/logError';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { dispatchDashboardDataReady } from '@/features/dashboard/lib/dashboardPanelEvents';
import { loadDashboardPanelData } from '@/features/dashboard/lib/loadDashboardPanelData';
import {
    DASHBOARD_FALLBACK_POLL_MS,
    DASHBOARD_POLL_MS,
    readPanelSyncPref,
    subscribeHomeDataReset,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';

const PANEL_SYNC_CHANNEL = 'dashboard_panel_data_sync';
const POLL_MS = DASHBOARD_POLL_MS;
const FALLBACK_POLL_MS = DASHBOARD_FALLBACK_POLL_MS;

export interface DashboardPanelContextValue {
    stats: DashboardLiveStats;
    activity: ActivityLogItem[];
    hasLiveData: boolean;
    error: string | null;
    syncing: boolean;
    syncLabel: string;
    highlightKeys: ReadonlySet<string>;
    isRealtimeLive: boolean;
}

const DashboardPanelContext = createContext<DashboardPanelContextValue | null>(null);

export function useDashboardPanel(): DashboardPanelContextValue {
    const ctx = useContext(DashboardPanelContext);
    if (!ctx) {
        throw new Error('useDashboardPanel debe usarse dentro de DashboardPanelProvider');
    }
    return ctx;
}

interface DashboardPanelProviderProps {
    active: boolean;
    session: Session;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    children: ReactNode;
}

export function DashboardPanelProvider({
    active,
    session,
    showToast,
    children
}: DashboardPanelProviderProps) {
    const [stats, setStats] = useState<DashboardLiveStats>(EMPTY_DASHBOARD_LIVE_STATS);
    const [activity, setActivity] = useState<ActivityLogItem[]>([]);
    const [hasLiveData, setHasLiveData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncLabel, setSyncLabel] = useState('90s');
    const [highlightKeys, setHighlightKeys] = useState<ReadonlySet<string>>(() => new Set());
    const [isTabLeader, setIsTabLeader] = useState(true);

    const countdownRef = useRef(90);
    const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const syncRef = useRef<TabSyncService | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRealtimeLiveRef = useRef(false);
    const panelBootstrappedRef = useRef(false);
    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const fetchPanelDataRef = useRef<
        (options?: { broadcast?: boolean; retryOnNetwork?: boolean; fresh?: boolean; silent?: boolean }) => Promise<boolean>
    >(async () => false);
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const dataReadyFiredRef = useRef(false);
    const syncingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const authRedirectTimerRef = useRef<number | null>(null);

    const markDataReady = useCallback(() => {
        if (dataReadyFiredRef.current) return;
        dataReadyFiredRef.current = true;
        setHasLiveData(true);
        reportSessionLoadProgress({
            progress: 99,
            label: 'Finalizando…',
            cached: false
        });
        dispatchDashboardDataReady();
    }, []);

    const markDataReadyRef = useRef(markDataReady);
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
        async (options?: {
            broadcast?: boolean;
            retryOnNetwork?: boolean;
            fresh?: boolean;
            silent?: boolean;
        }) => {
            const sync = syncRef.current;
            if (!sync?.isActive()) return false;

            const broadcast = options?.broadcast === true && sync.getIsLeader();
            if (!options?.silent) {
                setSyncing(true);
                setError(null);
            }
            reportSessionLoadProgress({
                progress: 70,
                label: 'Obteniendo estadísticas del panel…',
                cached: false
            });

            const loadOnce = async () => {
                const result = await loadDashboardPanelData(session, { fresh: options?.fresh });
                if (!sync.isActive() || syncRef.current !== sync) return null;
                return result;
            };

            try {
                const result = await loadOnce();
                if (!result) return false;

                const { analytics, activity: activityLogs, partialFailure } = result;

                if (broadcast) {
                    sync.broadcast('SYNC_STATS', analytics);
                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                }

                setStats(analytics);
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
                    logError('DashboardPanel', partialFailure, 'Carga parcial del panel');
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
                                const { analytics, activity: activityLogs, partialFailure } = retry;
                                if (broadcast) {
                                    sync.broadcast('SYNC_STATS', analytics);
                                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                                }
                                setStats(analytics);
                                setActivity(activityLogs);
                                markDataReadyRef.current();
                                setError(null);
                                if (partialFailure) {
                                    logError('DashboardPanel', partialFailure, 'Carga parcial del panel');
                                }
                                return true;
                            }
                        } catch {
                            /* sigue al error de usuario */
                        }
                    }
                }

                logError('DashboardPanel', e, 'Error cargando datos del panel');
                if (!options?.silent) {
                    setError(formatFetchErrorForUi(e));
                }
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
        await fetchPanelData({ broadcast: true, silent: true });
    }, [fetchPanelData]);

    performSyncRef.current = performSync;

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
        } else {
            countdown = Math.ceil(pollMs / 1000);
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
        setStats({ ...EMPTY_DASHBOARD_LIVE_STATS, ...next });
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
        id: 'dashboard',
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
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        } else if (active && isTabLeader) {
            startSmartPolling();
        }
    }, [active, isRealtimeLive, isTabLeader, startSmartPolling]);

    useEffect(() => {
        if (!active) {
            panelBootstrappedRef.current = false;
            return;
        }
        if (!isTabLeader || panelBootstrappedRef.current) return;
        panelBootstrappedRef.current = true;
        void fetchPanelDataRef.current({ broadcast: true, silent: true });
    }, [active, isTabLeader]);

    useEffect(() => {
        if (!active) return;

        return subscribeHomeDataReset(session.userId, () => {
            setStats(EMPTY_DASHBOARD_LIVE_STATS);
            setActivity([]);
            setError(null);
            dataReadyFiredRef.current = false;
            void fetchPanelDataRef.current({
                broadcast: true,
                retryOnNetwork: false,
                fresh: true,
                silent: true
            });
        });
    }, [active, session.userId]);

    useEffect(() => {
        if (!active) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (syncRef.current) {
                syncRef.current.destroy();
                syncRef.current = null;
            }
            return;
        }

        const sync = new TabSyncService(PANEL_SYNC_CHANNEL);
        syncRef.current = sync;
        const highlightTimers = highlightTimersRef.current;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            setIsTabLeader(data.isLeader);
            if (data.isLeader) {
                const raw = readPanelSyncPref(session.userId);
                const stale =
                    !raw || Date.now() - parseInt(raw, 10) >= FALLBACK_POLL_MS;
                if (stale && panelBootstrappedRef.current) {
                    void performSyncRef.current();
                }
            } else {
                setSyncLabel('Follower');
                if (!isRealtimeLiveRef.current) {
                    startSmartPolling();
                }
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => setActivity(payload as ActivityLogItem[]));
        sync.on('SYNC_STATS', (payload) => {
            setStats({ ...EMPTY_DASHBOARD_LIVE_STATS, ...(payload as DashboardLiveStats) });
            markDataReadyRef.current();
        });

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
        if (!isRealtimeLiveRef.current) {
            startSmartPolling();
        }

        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('realtime:auth-failed', onAuthFailed);
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
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
    }, [active, startSmartPolling, session.userId]);

    const value = useMemo<DashboardPanelContextValue>(
        () => ({
            stats,
            activity,
            hasLiveData,
            error,
            syncing,
            syncLabel,
            highlightKeys,
            isRealtimeLive
        }),
        [stats, activity, hasLiveData, error, syncing, syncLabel, highlightKeys, isRealtimeLive]
    );

    return <DashboardPanelContext.Provider value={value}>{children}</DashboardPanelContext.Provider>;
}
