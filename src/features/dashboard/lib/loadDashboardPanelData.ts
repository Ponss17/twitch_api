import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { fetchDashboardSummary } from '@/features/dashboard/lib/dashboardSummary';
import {
    EMPTY_DASHBOARD_LIVE_STATS,
    parseDashboardStatsFromRow,
    isStatsDateOutdated,
    type DashboardLiveStats
} from '@/features/dashboard/lib/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';
import type { Session } from '@/core/config/config';

export interface DashboardPanelLoadResult {
    analytics: DashboardLiveStats;
    /** false cuando el endpoint de summary falló — el caller debe conservar los stats anteriores. */
    analyticsLoaded: boolean;
    activity: ActivityLogItem[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any; // We will use any to avoid importing ProfileData type, but we should import it if possible
    partialFailure?: unknown;
}

export async function loadDashboardPanelData(
    session: Session,
    options?: { fresh?: boolean }
): Promise<DashboardPanelLoadResult> {
    const [summaryResult, activityResult, profileResult] = await Promise.allSettled([
        fetchDashboardSummary(session, undefined, { fresh: options?.fresh }),
        apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(API_ENDPOINTS.ACTIVITY, session),
        import('@/features/dashboard/lib/dashboardSummary').then(m => m.fetchDashboardProfile(session, { fresh: options?.fresh }))
    ]);

    let analytics: DashboardLiveStats = EMPTY_DASHBOARD_LIVE_STATS;
    let activity: ActivityLogItem[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profile: any = null;
    const failures: unknown[] = [];

    if (summaryResult.status === 'fulfilled') {
        const summary = summaryResult.value.analytics as Record<string, unknown> | null;
        
        // Si usamos caché (no fresh) y la fecha de los stats está desactualizada (ej. cruzó medianoche),
        // el HTTP caché nos está dando basura del día anterior. Forzamos un fetch real (bypassing browser cache).
        if (!options?.fresh && summary && isStatsDateOutdated(summary.last_stats_date)) {
            try {
                const freshSummary = await fetchDashboardSummary(session, undefined, { fresh: true });
                const freshData = freshSummary.analytics as Record<string, unknown> | null;
                analytics = freshData
                    ? (parseDashboardStatsFromRow(freshData) as DashboardLiveStats)
                    : EMPTY_DASHBOARD_LIVE_STATS;
            } catch (e) {
                failures.push(e);
            }
        } else {
            analytics = summary
                ? (parseDashboardStatsFromRow(summary) as DashboardLiveStats)
                : EMPTY_DASHBOARD_LIVE_STATS;
        }
    } else {
        failures.push(summaryResult.reason);
    }

    if (activityResult.status === 'fulfilled') {
        const payload = activityResult.value;
        activity = Array.isArray(payload) ? payload : (payload.logs ?? []);
    } else {
        failures.push(activityResult.reason);
    }
    
    if (profileResult.status === 'fulfilled') {
        profile = profileResult.value;
    } else {
        failures.push(profileResult.reason);
    }

    if (failures.length === 3) {
        throw failures[0];
    }

    return {
        analytics,
        analyticsLoaded: summaryResult.status === 'fulfilled',
        activity,
        profile,
        partialFailure: failures.length > 0 ? failures[0] : undefined
    };
}
