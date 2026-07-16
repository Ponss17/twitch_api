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

    // We store the performSync and fetchPanelData functions in refs to avoid useEffect dependency cycles
    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const fetchPanelDataRef = useRef<
        (options?: { broadcast?: boolean; retryOnNetwork?: boolean; fresh?: boolean; silent?: boolean }) => Promise<boolean>
    >(async () => false);

    const updateSyncLabel = useCallback(() => {
        if (refs.isRealtimeLiveRef.current) {
            actions.setSyncLabel('Realtime');
            return;
        }
        const sync = syncRef.current;
        if (!sync?.getIsLeader()) {
            actions.setSyncLabel(refs.hasLiveDataRef.current ? 'Realtime' : 'Sincronizando…');
            return;
        }
        actions.setSyncLabel(`${countdownRef.current}s`);
    }, [actions, refs.isRealtimeLiveRef, refs.hasLiveDataRef]);

    const fetchPanelData = useCallback(
        async (options?: {
            broadcast?: boolean;
            retryOnNetwork?: boolean;
            fresh?: boolean;
            silent?: boolean;
        }) => {
            const sync = syncRef.current;
            if (!sync?.isActive()) return false;
            if (panelFetchInFlightRef.current) return false;
            panelFetchInFlightRef.current = true;

            const currentSession = sessionRef.current;
            const broadcast = options?.broadcast === true && sync.getIsLeader();
            if (!options?.silent) {
                actions.setSyncing(true);
                actions.setError(null);
            }
            reportSessionLoadProgress({
                progress: 70,
                label: 'Obteniendo estadisticas del panel...',
                cached: false
            });

            const loadOnce = async () => {
                const result = await loadDashboardPanelData(currentSession, { fresh: options?.fresh });
                if (!sync.isActive() || syncRef.current !== sync) return null;
                return result;
            };

            try {
                const result = await loadOnce();
                if (!result) return false;

                const { analytics, analyticsLoaded, activity: activityLogs, profile: fetchedProfile, partialFailure } = result;

                if (broadcast) {
                    if (analyticsLoaded) sync.broadcast('SYNC_STATS', analytics);
                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                    if (fetchedProfile) sync.broadcast('SYNC_PROFILE', fetchedProfile);
                }

                if (analyticsLoaded) actions.setStats(analytics);
                actions.setActivity(activityLogs);
                if (fetchedProfile) actions.setProfile(fetchedProfile);
                
                actions.markDataReady();
                writePanelSyncPref(currentSession.userId, Date.now().toString());
                
                reportSessionLoadProgress({
                    progress: 94,
                    label: 'Preparando tu inicio...',
                    cached: false
                });

                if (refs.isRealtimeLiveRef.current) {
                    actions.setSyncLabel('Realtime');
                } else {
                    countdownRef.current = Math.ceil(POLL_MS / 1000);
                    updateSyncLabel();
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
                                const { analytics, analyticsLoaded, activity: activityLogs, profile: fetchedProfile, partialFailure } = retry;
                                if (broadcast) {
                                    if (analyticsLoaded) sync.broadcast('SYNC_STATS', analytics);
                                    sync.broadcast('SYNC_ACTIVITY', activityLogs);
                                    if (fetchedProfile) sync.broadcast('SYNC_PROFILE', fetchedProfile);
                                }
                                if (analyticsLoaded) actions.setStats(analytics);
                                actions.setActivity(activityLogs);
                                if (fetchedProfile) actions.setProfile(fetchedProfile);
                                actions.markDataReady();
                                actions.setError(null);
                                if (partialFailure) logError('DashboardPanel', partialFailure, 'Carga parcial del panel');
                                return true;
                            }
                        } catch {
                            // sigue al error de usuario
                        }
                    }
                }

                logError('DashboardPanel', e, 'Error cargando datos del panel');
                if (!options?.silent) {
                    actions.setError(formatFetchErrorForUi(e));
                }
                return false;
            } finally {
                panelFetchInFlightRef.current = false;
                if (syncingTimerRef.current) clearTimeout(syncingTimerRef.current);
                syncingTimerRef.current = setTimeout(() => actions.setSyncing(false), 800);
            }
        },
        [actions, updateSyncLabel, refs.isRealtimeLiveRef]
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

        const pollMs = refs.isRealtimeLiveRef.current ? POLL_MS : FALLBACK_POLL_MS;
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
        updateSyncLabel();

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            if (
                document.visibilityState === 'hidden' ||
                refs.isRealtimeLiveRef.current ||
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
    }, [performSync, session.userId, updateSyncLabel, refs.isRealtimeLiveRef]);

    const handleRealtimeDisconnect = useCallback(() => {
        if (!activeRef.current) return;
        actions.setSyncLabel(`${Math.ceil(FALLBACK_POLL_MS / 1000)}s`);
        void performSyncRef.current();
        startSmartPolling();
    }, [startSmartPolling, actions]);

    const { isLive: isRealtimeLive } = useDashboardRealtime({
        id: 'dashboard',
        active: state.isTabLeader,
        session,
        onStatsUpdate: (next) => {
            actions.handleRealtimeStats(next);
            syncRef.current?.broadcast('SYNC_STATS', next);
        },
        onActivityInsert: actions.handleRealtimeActivity,
        onDisconnect: handleRealtimeDisconnect
    });

    useEffect(() => {
        actions.setIsRealtimeLive(isRealtimeLive);
    }, [isRealtimeLive, actions]);

    useEffect(() => {
        if (isRealtimeLive) {
            actions.setSyncLabel('Realtime');
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => {
                if (
                    document.visibilityState === 'hidden' ||
                    !refs.isRealtimeLiveRef.current ||
                    !activeRef.current ||
                    !syncRef.current?.getIsLeader()
                ) return;
                void performSyncRef.current();
            }, REALTIME_SAFETY_POLL_MS);
        } else if (active && state.isTabLeader) {
            startSmartPolling();
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
    }, [active, isRealtimeLive, state.isTabLeader, startSmartPolling, actions, refs.isRealtimeLiveRef]);

    useEffect(() => {
        if (!state.isTabLeader) return;

        const checkMidnightRollover = () => {
            const today = getStatsLocalDateString(state.statsTimeZone);
            if (refs.todayLocalRef.current === today) return;
            refs.todayLocalRef.current = today;
            actions.setStats((prev) => ({
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
    }, [state.isTabLeader, state.statsTimeZone, refs.todayLocalRef, actions]);

    useEffect(() => {
        const sync = new TabSyncService(PANEL_SYNC_CHANNEL);
        syncRef.current = sync;
        const highlightTimers = refs.highlightTimersRef.current;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            actions.setIsTabLeader(data.isLeader);
            if (data.isLeader) {
                const raw = readPanelSyncPref(session.userId);
                const stale = !raw || Date.now() - parseInt(raw, 10) >= FALLBACK_POLL_MS;
                if (stale && panelBootstrappedRef.current) {
                    void performSyncRef.current();
                }
                updateSyncLabel();
            } else {
                updateSyncLabel();
                if (!refs.isRealtimeLiveRef.current) {
                    startSmartPolling();
                }
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => actions.setActivity(payload as any));
        sync.on('SYNC_PROFILE', (payload) => actions.setProfile(payload));
        sync.on('SYNC_STATS', (payload) => {
            actions.handleRealtimeStats(payload as any);
            if (!sync.getIsLeader() && !refs.isRealtimeLiveRef.current) {
                actions.setSyncLabel('Realtime');
            }
        });

        const onVisible = () => {
            if (
                document.visibilityState === 'visible' &&
                sync.isActive() &&
                sync.getIsLeader() &&
                !refs.isRealtimeLiveRef.current
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

        actions.setIsTabLeader(sync.getIsLeader());
        if (!refs.isRealtimeLiveRef.current) {
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
            refs.dataReadyFiredRef.current = false;
            panelBootstrappedRef.current = false;
        };
    }, [startSmartPolling, session.userId, updateSyncLabel, actions, refs]);

    useEffect(() => {
        if (!state.isTabLeader || panelBootstrappedRef.current) return;
        panelBootstrappedRef.current = true;
        if (consumeHomeDataResetPending(session.userId)) {
            actions.applyHomeDataReset(() => fetchPanelDataRef.current({ broadcast: true, silent: true }) as Promise<any>);
            return;
        }
        void fetchPanelDataRef.current({ broadcast: true, silent: true });
    }, [state.isTabLeader, session.userId, actions]);

    useEffect(() => {
        return subscribeHomeDataReset(session.userId, () => {
            actions.applyHomeDataReset(() => fetchPanelDataRef.current({ broadcast: true, silent: true }) as Promise<any>);
        });
    }, [session.userId, actions]);

    useEffect(() => {
        if (!active || !session.userId) return;
        if (consumeHomeDataResetPending(session.userId)) {
            actions.applyHomeDataReset(() => fetchPanelDataRef.current({ broadcast: true, silent: true }) as Promise<any>);
            return;
        }
        const lastSyncRaw = readPanelSyncPref(session.userId);
        if (!lastSyncRaw) return;
        const stale = Date.now() - parseInt(lastSyncRaw, 10) > 10_000;
        if (stale && panelBootstrappedRef.current && !panelFetchInFlightRef.current) {
            void fetchPanelDataRef.current({ broadcast: true, retryOnNetwork: false, fresh: true, silent: true });
        }
    }, [active, session.userId, actions]);

}