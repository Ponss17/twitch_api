import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';
import type { DashboardTab } from '@/lib/config';
import { apiFetch } from '@/lib/auth';
import { appPath } from '@/lib/paths';
import { TabSyncService } from '@/lib/tabSyncService';

// Lazy-loaded to avoid pulling ~178KB Supabase into the initial bundle
const loadRealtimeModule = () => import('@/lib/realtimeService');
import { HomeHero } from '@/components/views/HomeHero';
import { HomeActivityFeed } from '@/components/views/HomeActivityFeed';
import { HomeResourcesPanel } from '@/components/views/HomeResourcesPanel';
import { useRequiredSession } from '@/hooks/useSession';
import { fadeIn } from '@/lib/tw';
import type { ActivityLogItem } from '@/lib/activityLogDisplay';
import { useToast } from '@/components/ui/ToastProvider';
import { HomeViewSkeleton } from '@/components/ui/Skeleton';
import { logError } from '@/lib/logError';

interface AnalyticsData {
    todayRequests?: number;
    rawSuccessRate?: number;
    avgLatencyMs?: number;
}

interface HealthStatus {
    status?: string;
}

interface HomeViewProps {
    onNavigate?: (tab: DashboardTab) => void;
    active?: boolean;
}

const POLL_MS = 90000;
const HEALTH_POLL_MS = 300000;

export function HomeView({ onNavigate, active = true }: HomeViewProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [activity, setActivity] = useState<ActivityLogItem[]>([]);
    const [, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncLabel, setSyncLabel] = useState('90s');
    const countdownRef = useRef(90);
    const syncRef = useRef<TabSyncService | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const healthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const realtimeRef = useRef<{ setCallbacks: (cb: any) => void; resume: () => Promise<boolean>; connect: (onDisconnect?: () => void) => Promise<boolean>; pause: () => void; disconnect: () => void } | null>(null);
    const useRealtimeRef = useRef(false);
    const performSyncRef = useRef<() => Promise<void>>(async () => {});
    const connectRealtimeRef = useRef<() => Promise<void>>(async () => {});
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    const displayName = session.displayName ?? session.login ?? 'Streamer';

    const performSync = useCallback(async () => {
        const sync = syncRef.current;
        if (!sync?.getIsLeader() || !sync.isActive()) return;
        setSyncing(true);
        localStorage.setItem('dashboard_last_sync', Date.now().toString());

        try {
            const [analyticsRes, activityRes] = await Promise.all([
                apiFetch<AnalyticsData>(API_ENDPOINTS.ANALYTICS, session),
                apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(API_ENDPOINTS.ACTIVITY, session)
            ]);

            if (!sync.isActive() || syncRef.current !== sync) return;

            const activityLogs = Array.isArray(activityRes) ? activityRes : (activityRes.logs ?? []);

            sync.broadcast('SYNC_STATS', analyticsRes);
            sync.broadcast('SYNC_ACTIVITY', activityLogs);

            setStats(analyticsRes);
            setActivity(activityLogs);
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
            setTimeout(() => setSyncing(false), 800);
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
            setHealth(healthRes as HealthStatus);
        } catch {
            setHealth({ status: 'error' });
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

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        let countdown = Math.ceil(POLL_MS / 1000);

        if (lastSync) {
            const elapsed = now - parseInt(lastSync, 10);
            if (elapsed < POLL_MS) {
                countdown = Math.ceil((POLL_MS - elapsed) / 1000);
            } else if (sync.getIsLeader()) {
                void performSync();
            }
        } else if (sync.getIsLeader()) {
            void performSync();
        } else {
            setLoading(false);
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
    }, [performSync]);

    const connectRealtime = useCallback(async () => {
        const { RealtimeServiceFactory, isRealtimeInCooldown } = await loadRealtimeModule();

        if (isRealtimeInCooldown()) {
            useRealtimeRef.current = false;
            startSmartPolling();
            return;
        }

        const callbacks = {
            onStatsUpdate: (next: AnalyticsData) => {
                setStats(next);
                setLoading(false);
            },
            onActivityInsert: (log: ActivityLogItem) => {
                setActivity((prev) => {
                    const exists = prev.some(
                        (item) => item.timestamp === log.timestamp && item.action === log.action
                    );
                    if (exists) return prev;
                    return [log, ...prev].slice(0, 50);
                });
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
    }, [performSync, session, startHealthPolling, startSmartPolling]);

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
            realtimeRef.current?.pause();
            return;
        }

        const sync = new TabSyncService('dashboard_home_sync');
        syncRef.current = sync;

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            if (data.isLeader) {
                void performSyncRef.current();
            } else if (!useRealtimeRef.current) {
                setSyncLabel('Follower');
            }
        });

        sync.on('SYNC_ACTIVITY', (payload) => setActivity(payload as ActivityLogItem[]));
        sync.on('SYNC_STATS', (payload) => setStats(payload as AnalyticsData));
        sync.on('SYNC_HEALTH', (payload) => setHealth(payload as HealthStatus));

        const onVisible = () => {
            if (document.visibilityState === 'visible' && sync.isActive() && sync.getIsLeader() && !useRealtimeRef.current) {
                void performSyncRef.current();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        const onAuthFailed = () => {
            showToastRef.current('Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => {
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
            sync.destroy();
            syncRef.current = null;
            realtimeRef.current?.pause();
        };
    }, [active]);

    useEffect(() => {
        if (stats !== null) {
            setLoading(false);
            window.dispatchEvent(new CustomEvent('home:data-ready'));
        }
    }, [stats]);


    if (loading && !stats) {
        return <HomeViewSkeleton />;
    }

    if (error && !stats) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-[#0f0f11] p-6 text-red-400">
                <i className="fa-solid fa-triangle-exclamation mr-2" />
                {error}
            </div>
        );
    }

    const latencyMs = stats?.avgLatencyMs ?? 0;

    return (
        <div className={fadeIn}>
            <HomeHero
                displayName={displayName}
                todayRequests={stats?.todayRequests ?? 0}
                successRate={stats?.rawSuccessRate ?? 0}
                latencyMs={latencyMs}
            />

            <div className="grid grid-cols-1 items-stretch gap-6 min-[1001px]:grid-cols-[1fr_300px]">
                <HomeActivityFeed activity={activity} syncing={syncing} syncLabel={syncLabel} />
                <HomeResourcesPanel onNavigate={onNavigate} />
            </div>
        </div>
    );
}
