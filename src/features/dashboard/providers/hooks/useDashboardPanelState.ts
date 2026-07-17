import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Session } from '@/core/config/config';
import {
    EMPTY_DASHBOARD_LIVE_STATS,
    getStatsLocalDateString,
    mergeDashboardStats,
    type DashboardLiveStats,
    type RealtimeStatsUpdate
} from '@/features/dashboard/lib/dashboardStats';
import { activityEntryKey, type ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { dispatchDashboardDataReady } from '@/features/dashboard/lib/dashboardPanelEvents';
import { consumeHomeDataResetPending } from '@/features/dashboard/lib/dashboardSync';
import type { DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';

export function useDashboardPanelState(session: Session) {
    const [stats, setStats] = useState<DashboardLiveStats>(EMPTY_DASHBOARD_LIVE_STATS);
    const [activity, setActivity] = useState<ActivityLogItem[]>([]);
    const [profile, setProfile] = useState<DashboardProfile | null>(null);
    const [hasLiveData, setHasLiveData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncLabel, setSyncLabel] = useState('90s');
    const [highlightKeys, setHighlightKeys] = useState<ReadonlySet<string>>(() => new Set());
    const [isTabLeader, setIsTabLeader] = useState(false);
    const [isRealtimeLive, setIsRealtimeLive] = useState(false);

    // Refs for state
    const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const dataReadyFiredRef = useRef(false);
    const hasLiveDataRef = useRef(false);
    hasLiveDataRef.current = hasLiveData;
    const isRealtimeLiveRef = useRef(false);
    isRealtimeLiveRef.current = isRealtimeLive;
    const isTabLeaderRef = useRef(false);
    isTabLeaderRef.current = isTabLeader;

    const resetPendingRef = useRef(false);
    const todayLocalRef = useRef(getStatsLocalDateString());

    const statsTimeZone =
        typeof profile?.timezone === 'string' && profile.timezone.length > 0
            ? profile.timezone
            : undefined;

    useEffect(() => {
        if (!statsTimeZone) return;
        todayLocalRef.current = getStatsLocalDateString(statsTimeZone);
    }, [statsTimeZone]);

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

    const applyHomeDataReset = useCallback(
        (engineFetchDataCallback: () => Promise<void>) => {
            consumeHomeDataResetPending(session.userId);
            resetPendingRef.current = true;
            setStats(EMPTY_DASHBOARD_LIVE_STATS);
            setActivity([]);
            setError(null);
            setHighlightKeys(new Set());
            dataReadyFiredRef.current = false;
            
            engineFetchDataCallback().then(() => {
                resetPendingRef.current = false;
            });
        },
        [session.userId]
    );

    const handleRealtimeStats = useCallback((next: RealtimeStatsUpdate) => {
        if (resetPendingRef.current) return;
        setStats((prev) => mergeDashboardStats(prev, next));
        markDataReady();
    }, [markDataReady]);

    const handleRealtimeActivity = useCallback(
        (log: ActivityLogItem) => {
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

    const actions = useMemo(
        () => ({
            setStats,
            setActivity,
            setProfile,
            setError,
            setSyncing,
            setSyncLabel,
            setIsTabLeader,
            setIsRealtimeLive,
            markDataReady,
            markActivityHighlight,
            applyHomeDataReset,
            handleRealtimeStats,
            handleRealtimeActivity
        }),
        [markDataReady, markActivityHighlight, applyHomeDataReset, handleRealtimeStats, handleRealtimeActivity]
    );

    const refs = useMemo(
        () => ({
            highlightTimersRef,
            dataReadyFiredRef,
            hasLiveDataRef,
            isRealtimeLiveRef,
            isTabLeaderRef,
            resetPendingRef,
            todayLocalRef
        }),
        []
    );

    return {
        state: {
            stats,
            activity,
            profile,
            hasLiveData,
            error,
            syncing,
            syncLabel,
            highlightKeys,
            isTabLeader,
            isRealtimeLive,
            statsTimeZone
        },
        actions,
        refs
    };
}