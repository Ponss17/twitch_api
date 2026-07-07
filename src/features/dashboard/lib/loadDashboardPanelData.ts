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
    activity: ActivityLogItem[];
    partialFailure?: unknown;
}

export async function loadDashboardPanelData(
    session: Session,
    options?: { fresh?: boolean }
): Promise<DashboardPanelLoadResult> {
    const [summaryResult, activityResult] = await Promise.allSettled([
        fetchDashboardSummary(session, undefined, { fresh: options?.fresh }),
        apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(API_ENDPOINTS.ACTIVITY, session)
    ]);

    let analytics: DashboardLiveStats = EMPTY_DASHBOARD_LIVE_STATS;
    let activity: ActivityLogItem[] = [];
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

    if (failures.length === 2) {
        throw failures[0];
    }

    return {
        analytics,
        activity,
        partialFailure: failures[0]
    };
}
