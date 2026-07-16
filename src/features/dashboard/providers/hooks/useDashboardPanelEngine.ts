import { useEffect, useRef, useCallback } from 'react';
import type { Session } from '@/core/config/config';
import { appPath } from '@/core/config/paths';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import { useDashboardRealtime } from '@/features/dashboard/hooks/useDashboardRealtime';
import { formatFetchErrorForUi, isFetchNetworkError } from '@/core/api/apiError';
import { logError } from '@/core/logging/logError';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { isWithinSessionAuthGrace } from '@/core/auth/sessionAuthGrace';
import { loadDashboardPanelData } from '@/features/dashboard/lib/loadDashboardPanelData';
import {
    DASHBOARD_FALLBACK_POLL_MS,
    DASHBOARD_POLL_MS,
    readPanelSyncPref,
    subscribeHomeDataReset,
    writePanelSyncPref,
    consumeHomeDataResetPending
} from '@/features/dashboard/lib/dashboardSync';
import { EMPTY_DASHBOARD_LIVE_STATS, getStatsLocalDateString } from '@/features/dashboard/lib/dashboardStats';
import type { useDashboardPanelState } from './useDashboardPanelState';

const PANEL_SYNC_CHANNEL = 'dashboard_panel_data_sync';
const POLL_MS = DASHBOARD_POLL_MS;
const FALLBACK_POLL_MS = DASHBOARD_FALLBACK_POLL_MS;
const REALTIME_SAFETY_POLL_MS = 120_000;

interface UseDashboardPanelEngineOptions {
    active: boolean;
    session: Session;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    state: ReturnType<typeof useDashboardPanelState>['state'];
    actions: ReturnType<typeof useDashboardPanelState>['actions'];
    refs: ReturnType<typeof useDashboardPanelState>['refs'];
}

export function useDashboardPanelEngine({
    active,
    session,
    showToast,
    state,
    actions,
    refs
}: UseDashboardPanelEngineOptions) {
    const countdownRef = useRef(90);
    const syncRef = useRef<TabSyncService | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const panelBootstrappedRef = useRef(false);
    const panelFetchInFlightRef = useRef(false);
    const syncingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const authRedirectTimerRef = useRef<number | null>(null);

    const activeRef = useRef(active);
    activeRef.current = active;
    const sessionRef = useRef(session);
    sessionRef.current = session;
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    const refsBag = useRef(refs);
    refsBag.current = refs;

    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const fetchPanelDataRef = useRef<
        (options?: { broadcast?: boolean; retryOnNetwork?: boolean; fresh?: boolean; silent?: boolean }) => Promise<boolean>
    >(async () => false);
    const startSmartPollingRef = useRef<() => void>(() => {});

    const updateSyncLabel = useCallback(() => {
        const currentActions = actionsRef.current;
        const currentRefs = refsBag.current;
        if (currentRefs.isRealtimeLiveRef.current) {
            currentActions.setSyncLabel('Realtime');
            return;
        }
        const sync = syncRef.current;
        if (!sync?.getIsLeader()) {
            currentActions.setSyncLabel(currentRefs.hasLiveDataRef.current ? 'Realtime' : 'Sincronizando…');
            return;
        }
        currentActions.setSyncLabel(`${countdownRef.current}s`);
    }, []);

    const fetchPanelData = useCallback(
        async (options?: {
            broadcast?: boolean;
            retryOnNetwork?: boolean;
            fresh?: boolean;
            silent?: boolean;
        }) => {
            const sync = syncRef.current;
            const currentActions = actionsRef.current;
            const currentRefs = refsBag.current;
            if (!sync?.isActive()) return false;
            if (panelFetchInFlightRef.current) return false;
            panelFetchInFlightRef.current = true;

            const currentSession = sessionRef.current;
            const broadcast = options?.broadcast === true && sync.getIsLeader();
            if (!options?.silent) {
                currentActions.setSyncing(true);
                currentActions.setError(null);
            }
            reportSessionLoadProgress({
                progress: 70,
                label: 'Obteniendo estadisticas del panel...',
                cached: false
            });

            const applyResult = (
                result: Awaited<ReturnType<typeof loadDashboardPanelData>>,
                opts: { broadcast: boolean; clearError?: boolean }
            ) => {
                const { analytics, analyticsLoaded, activity: activityLogs, profile: fetchedProfile, partialFailure } =
                    result;
                const liveSync = syncRef.current;

                if (opts.broadcast && liveSync?.isActive() && liveSync.getIsLeader()) {
                    if (analyticsLoaded) liveSync.broadcast('SYNC_STATS', analytics);
                    liveSync.broadcast('SYNC_ACTIVITY', activityLogs);
                    if (fetchedProfile) liveSync.broadcast('SYNC_PROFILE', fetchedProfile);
                }

                if (analyticsLoaded) currentActions.setStats(analytics);
                currentActions.setActivity(activityLogs);
                if (fetchedProfile) currentActions.setProfile(fetchedProfile);
                currentActions.markDataReady();
                if (opts.clearError) currentActions.setError(null);
                writePanelSyncPref(currentSession.userId, Date.now().toString());

                if (currentRefs.isRealtimeLiveRef.current) {
                    currentActions.setSyncLabel('Realtime');
                } else {
                    countdownRef.current = Math.ceil(POLL_MS / 1000);
                    updateSyncLabel();
                }

                if (partialFailure) {
                    logError('DashboardPanel', partialFailure, 'Carga parcial del panel');
                }
            };

            try {
                const result = await loadDashboardPanelData(currentSession, { fresh: options?.fresh });
                // Aplicar aunque TabSync se haya recreado: los datos REST son válidos para esta sesión.
                if (!activeRef.current || sessionRef.current.userId !== currentSession.userId) {
                    return false;
                }

                applyResult(result, { broadcast });
                reportSessionLoadProgress({
                    progress: 94,
                    label: 'Preparando tu inicio...',
                    cached: false
                });
                return true;
            } catch (e) {
                if (!activeRef.current || sessionRef.current.userId !== currentSession.userId) {
                    return false;
                }

                if (isFetchNetworkError(e) && options?.retryOnNetwork !== false) {
                    await new Promise((r) => setTimeout(r, 800));
                    if (activeRef.current && sessionRef.current.userId === currentSession.userId) {
                        try {
                            const retry = await loadDashboardPanelData(currentSession, { fresh: options?.fresh });
                            applyResult(retry, { broadcast, clearError: true });
                            return true;
                        } catch {
                            // sigue al error de usuario
                        }
                    }
                }

                logError('DashboardPanel', e, 'Error cargando datos del panel');
                if (!options?.silent) {
                    currentActions.setError(formatFetchErrorForUi(e));
                }
                return false;
            } finally {
                panelFetchInFlightRef.current = false;
                if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
                syncingTimerRef.current = setTimeout(() => actionsRef.current.setSyncing(false), 800);
            }
        },
        [updateSyncLabel]
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

        const currentRefs = refsBag.current;
        const userId = sessionRef.current.userId;
        const pollMs = currentRefs.isRealtimeLiveRef.current ? POLL_MS : FALLBACK_POLL_MS;
        const lastSyncRaw = readPanelSyncPref(userId);
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
        updateSyncLabel();

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            if (
                document.visibilityState === 'hidden' ||
                refsBag.current.isRealtimeLiveRef.current ||
                !activeRef.current
            ) {
                return;
            }

            if (!sync.getIsLeader()) {
                updateSyncLabel();
                return;
            }

            countdownRef.current -= 1;
            if (countdownRef.current <= 0) {
                void performSync();
                countdownRef.current = Math.ceil(pollMs / 1000);
            }
            updateSyncLabel();
        }, 1000);
    }, [performSync, updateSyncLabel]);

    startSmartPollingRef.current = startSmartPolling;

    const handleRealtimeDisconnect = useCallback(() => {
        if (!activeRef.current) return;
        actionsRef.current.setSyncLabel(`${Math.ceil(FALLBACK_POLL_MS / 1000)}s`);
        void performSyncRef.current();
        startSmartPollingRef.current();
    }, []);

    const { isLive: isRealtimeLive } = useDashboardRealtime({
        id: 'dashboard',
        active: state.isTabLeader,
        session,
        onStatsUpdate: (next) => {
            actionsRef.current.handleRealtimeStats(next);
            syncRef.current?.broadcast('SYNC_STATS', next);
        },
        onActivityInsert: (log) => actionsRef.current.handleRealtimeActivity(log),
        onDisconnect: handleRealtimeDisconnect
    });

    useEffect(() => {
        actionsRef.current.setIsRealtimeLive(isRealtimeLive);
    }, [isRealtimeLive]);

    useEffect(() => {
        if (isRealtimeLive) {
            actionsRef.current.setSyncLabel('Realtime');
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => {
                if (
                    document.visibilityState === 'hidden' ||
                    !refsBag.current.isRealtimeLiveRef.current ||
                    !activeRef.current ||
                    !syncRef.current?.getIsLeader()
                ) {
                    return;
                }
                void performSyncRef.current();
            }, REALTIME_SAFETY_POLL_MS);
        } else if (active && state.isTabLeader) {
            startSmartPollingRef.current();
        } else if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [active, isRealtimeLive, state.isTabLeader]);

    useEffect(() => {
        if (!state.isTabLeader) return;

        const checkMidnightRollover = () => {
            const today = getStatsLocalDateString(state.statsTimeZone);
            if (refsBag.current.todayLocalRef.current === today) return;
            refsBag.current.todayLocalRef.current = today;
            actionsRef.current.setStats((prev) => ({
                ...EMPTY_DASHBOARD_LIVE_STATS,
                timeSeries: prev.timeSeries
            }));
            void fetchPanelDataRef.current({
                broadcast: true,
                retryOnNetwork: false,
                fresh: true,
                silent: true
            });
        };

        const interval = setInterval(checkMidnightRollover, 30_000);
        const onVisible = () => {
            if (document.visibilityState === 'visible') checkMidnightRollover();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [state.isTabLeader, state.statsTimeZone]);

    // Solo recrear TabSync al cambiar de usuario — antes se recreaba cada render y descartaba los 200.
    useEffect(() => {
        panelBootstrappedRef.current = false;
        refsBag.current.dataReadyFiredRef.current = false;

        const sync = new TabSyncService(PANEL_SYNC_CHANNEL);
        syncRef.current = sync;
        const highlightTimers = refsBag.current.highlightTimersRef.current;
        const userId = session.userId;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            actionsRef.current.setIsTabLeader(data.isLeader);
            if (data.isLeader) {
                const raw = readPanelSyncPref(userId);
                const stale = !raw || Date.now() - parseInt(raw, 10) >= FALLBACK_POLL_MS;
                if (stale && panelBootstrappedRef.current) {
                    void performSyncRef.current();
                }
                updateSyncLabel();
            } else {
                updateSyncLabel();
                if (!refsBag.current.isRealtimeLiveRef.current) {
                    startSmartPollingRef.current();
                }
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => {
            actionsRef.current.setActivity(payload as unknown as never[]);
            actionsRef.current.markDataReady();
        });
        sync.on('SYNC_PROFILE', (payload) => actionsRef.current.setProfile(payload));
        sync.on('SYNC_STATS', (payload) => {
            actionsRef.current.handleRealtimeStats(payload as unknown as never);
            if (!sync.getIsLeader() && !refsBag.current.isRealtimeLiveRef.current) {
                actionsRef.current.setSyncLabel('Realtime');
            }
        });

        const onVisible = () => {
            if (
                document.visibilityState === 'visible' &&
                sync.isActive() &&
                sync.getIsLeader() &&
                !refsBag.current.isRealtimeLiveRef.current
            ) {
                void performSyncRef.current();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        const onAuthFailed = () => {
            if (isWithinSessionAuthGrace()) return;
            showToastRef.current('Sesion expirada. Redirigiendo al login...', 'error');
            authRedirectTimerRef.current = window.setTimeout(() => {
                window.location.href = appPath('/');
            }, 2000);
        };
        window.addEventListener('realtime:auth-failed', onAuthFailed);

        actionsRef.current.setIsTabLeader(sync.getIsLeader());
        if (!refsBag.current.isRealtimeLiveRef.current) {
            startSmartPollingRef.current();
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
        };
    }, [session.userId, updateSyncLabel]);

    useEffect(() => {
        if (!state.isTabLeader || panelBootstrappedRef.current) return;
        panelBootstrappedRef.current = true;
        if (consumeHomeDataResetPending(session.userId)) {
            actionsRef.current.applyHomeDataReset(async () => {
                await fetchPanelDataRef.current({ broadcast: true, silent: true });
            });
            return;
        }
        void fetchPanelDataRef.current({ broadcast: true, silent: true });
    }, [state.isTabLeader, session.userId]);

    useEffect(() => {
        return subscribeHomeDataReset(session.userId, () => {
            actionsRef.current.applyHomeDataReset(async () => {
                await fetchPanelDataRef.current({ broadcast: true, silent: true });
            });
        });
    }, [session.userId]);

    useEffect(() => {
        if (!active || !session.userId) return;
        if (consumeHomeDataResetPending(session.userId)) {
            actionsRef.current.applyHomeDataReset(async () => {
                await fetchPanelDataRef.current({ broadcast: true, silent: true });
            });
            return;
        }
        const lastSyncRaw = readPanelSyncPref(session.userId);
        if (!lastSyncRaw) return;
        const stale = Date.now() - parseInt(lastSyncRaw, 10) > 10_000;
        if (stale && panelBootstrappedRef.current && !panelFetchInFlightRef.current) {
            void fetchPanelDataRef.current({ broadcast: true, retryOnNetwork: false, fresh: true, silent: true });
        }
    }, [active, session.userId]);
}
