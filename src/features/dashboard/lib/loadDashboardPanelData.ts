import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { fetchDashboardSummary } from '@/features/dashboard/lib/dashboardSummary';
import {
    EMPTY_DASHBOARD_LIVE_STATS,
    parseDashboardStatsFromRow,
    isStatsDateOutdated,
    getStatsLocalDateString,
    type DashboardLiveStats
} from '@/features/dashboard/lib/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';
import type { Session } from '@/core/config/config';
import type { DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';

export interface DashboardPanelLoadResult {
    analytics: DashboardLiveStats;
    /** false cuando el endpoint de summary falló — el caller debe conservar los stats anteriores. */
    analyticsLoaded: boolean;
    activity: ActivityLogItem[];
    profile: DashboardProfile | null;
    partialFailure?: unknown;
}

export async function loadDashboardPanelData(
    session: Session,
    options?: { fresh?: boolean }
): Promise<DashboardPanelLoadResult> {
    const [summaryResult, activityResult, profileResult] = await Promise.allSettled([
        fetchDashboardSummary(session, undefined, { fresh: options?.fresh }),
        apiFetch<ActivityLogItem[] | { logs?: ActivityLogItem[] }>(
            API_ENDPOINTS.ACTIVITY,
            session,
            {},
            { logoutOn401: false }
        ),
        import('@/features/dashboard/lib/dashboardSummary').then((m) =>
            m.fetchDashboardProfile(session, { fresh: options?.fresh })
        )
    ]);

    let analytics: DashboardLiveStats = EMPTY_DASHBOARD_LIVE_STATS;
    let activity: ActivityLogItem[] = [];
    let profile: DashboardProfile | null = null;
    const failures: unknown[] = [];

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

    const statsTimeZone =
        typeof profile?.timezone === 'string' && profile.timezone.length > 0
            ? profile.timezone
            : undefined;
    const todayLocal = getStatsLocalDateString(statsTimeZone);

    if (summaryResult.status === 'fulfilled') {
        let summary = summaryResult.value.analytics as Record<string, unknown> | null;

        if (!options?.fresh && summary && isStatsDateOutdated(summary.last_stats_date, todayLocal)) {
            try {
                const freshSummary = await fetchDashboardSummary(session, undefined, { fresh: true });
                summary = freshSummary.analytics as Record<string, unknown> | null;
            } catch (e) {
                failures.push(e);
            }
        }

        analytics = summary
            ? (parseDashboardStatsFromRow(summary, { todayLocal }) as DashboardLiveStats)
            : EMPTY_DASHBOARD_LIVE_STATS;
    } else {
        failures.push(summaryResult.reason);
    }

    if (summaryResult.status === 'rejected' && activityResult.status === 'rejected') {
        throw summaryResult.reason;
    }

    if (failures.length >= 3) {
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
