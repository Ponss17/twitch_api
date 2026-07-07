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
    consumeHomeDataResetPending,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';

const PANEL_SYNC_CHANNEL = 'dashboard_panel_data_sync';
const POLL_MS = DASHBOARD_POLL_MS;
const FALLBACK_POLL_MS = DASHBOARD_FALLBACK_POLL_MS;
/** Poll de seguridad mínimo cuando Realtime está activo — garantiza datos frescos aunque el WS falle silenciosamente. */
const REALTIME_SAFETY_POLL_MS = 120_000;

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
    const activeRef = useRef(active);
    activeRef.current = active;
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
    /** true mientras se ejecuta applyHomeDataReset — bloquea eventos de Realtime rezagados. */
    const resetPendingRef = useRef(false);

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

    const applyHomeDataReset = useCallback(() => {
        consumeHomeDataResetPending(session.userId);
        resetPendingRef.current = true;
        setStats(EMPTY_DASHBOARD_LIVE_STATS);
        setActivity([]);
        setError(null);
        setHighlightKeys(new Set());
        dataReadyFiredRef.current = false;
        void fetchPanelDataRef.current({
            broadcast: true,
            retryOnNetwork: false,
            fresh: true,
            silent: true
        }).then(() => {
            resetPendingRef.current = false;
        });
    }, [session.userId]);

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
            if (
                document.visibilityState === 'hidden' ||
                isRealtimeLiveRef.current ||
                !activeRef.current
            ) {
                return;
            }

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
        if (resetPendingRef.current) return;
        // Merge con estado previo — evita resetear a 0 campos que no vienen en el payload
        setStats((prev) => ({ ...prev, ...next }));
        markDataReadyRef.current();
        syncRef.current?.broadcast('SYNC_STATS', next);
    }, []);

    const handleRealtimeActivity = useCallback(
        (log: ActivityLogItem) => {
            // Ignorar eventos de Realtime rezagados mientras se ejecuta un reset de datos
            if (resetPendingRef.current) return;
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

    const handleRealtimeActivityDelete = useCallback(() => {
        // Un DELETE en activity_logs (borrado total desde zona peligrosa) limpia el feed local
        if (!resetPendingRef.current) {
            setActivity([]);
        }
    }, []);

    const handleRealtimeDisconnect = useCallback(() => {
        if (!activeRef.current) return;
        setSyncLabel(`${Math.ceil(FALLBACK_POLL_MS / 1000)}s`);
        void performSyncRef.current();
        startSmartPolling();
    }, [startSmartPolling]);

    const { isLive: isRealtimeLive } = useDashboardRealtime({
        id: 'dashboard',
        // Realtime activo mientras Inicio está montado (aunque estés en Followage, etc.)
        active: isTabLeader,
        session,
        onStatsUpdate: handleRealtimeStats,
        onActivityInsert: handleRealtimeActivity,
        onActivityDelete: handleRealtimeActivityDelete,
        onDisconnect: handleRealtimeDisconnect
    });

    isRealtimeLiveRef.current = isRealtimeLive;

    useEffect(() => {
        if (isRealtimeLive) {
            setSyncLabel('Realtime');
            // Mantener un poll de seguridad mínimo aunque Realtime esté activo.
            // Garantiza sincronía si el WS falla silenciosamente (sin disparar onDisconnect).
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => {
                if (
                    document.visibilityState === 'hidden' ||
                    !isRealtimeLiveRef.current ||
                    !activeRef.current ||
                    !syncRef.current?.getIsLeader()
                ) return;
                void performSyncRef.current();
            }, REALTIME_SAFETY_POLL_MS);
        } else if (active && isTabLeader) {
            startSmartPolling();
        }
    }, [active, isRealtimeLive, isTabLeader, startSmartPolling]);

    useEffect(() => {
        if (!isTabLeader || panelBootstrappedRef.current) return;
        panelBootstrappedRef.current = true;
        if (consumeHomeDataResetPending(session.userId)) {
            applyHomeDataReset();
            return;
        }
        void fetchPanelDataRef.current({ broadcast: true, silent: true });
    }, [isTabLeader, session.userId, applyHomeDataReset]);

    useEffect(() => {
        return subscribeHomeDataReset(session.userId, applyHomeDataReset);
    }, [session.userId, applyHomeDataReset]);

    useEffect(() => {
        if (!active || !session.userId) return;
        if (consumeHomeDataResetPending(session.userId)) {
            applyHomeDataReset();
            return;
        }
        // Al volver al tab Home, re-fetch si los datos tienen más de 10s de antigüedad.
        // Esto garantiza que ver el Home después de hacer una petición en Followage
        // siempre muestre los stats actualizados.
        const lastSyncRaw = readPanelSyncPref(session.userId);
        const stale = !lastSyncRaw || Date.now() - parseInt(lastSyncRaw, 10) > 10_000;
        if (stale && panelBootstrappedRef.current) {
            void fetchPanelDataRef.current({ broadcast: true, retryOnNetwork: false, fresh: true, silent: true });
        }
    }, [active, session.userId, applyHomeDataReset]);

    useEffect(() => {
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
            // Merge con el estado previo — evita resetear a 0 campos que no vienen en el broadcast
            setStats((prev) => ({ ...prev, ...(payload as DashboardLiveStats) }));
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
            panelBootstrappedRef.current = false;
        };
    }, [startSmartPolling, session.userId]);

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
