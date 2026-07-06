import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { fetchDashboardSummary } from '@/features/dashboard/lib/dashboardSummary';
import {
    EMPTY_DASHBOARD_LIVE_STATS,
    parseDashboardStatsFromRow,
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
        const summary = summaryResult.value.analytics;
        analytics = summary
            ? parseDashboardStatsFromRow(summary as Record<string, unknown>)
            : EMPTY_DASHBOARD_LIVE_STATS;
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
