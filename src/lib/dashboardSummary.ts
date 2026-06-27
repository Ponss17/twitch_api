import { API_ENDPOINTS } from './config';
import type { Session } from './config';
import { apiFetch } from './auth';

export interface DashboardAnalytics {
    todayRequests?: number;
    rawSuccessRate?: number;
    avgLatencyMs?: number;
    [key: string]: number | undefined;
}

export interface DashboardProfile {
    followers?: number;
    broadcaster_type?: string;
    description?: string;
    created_at?: string;
    rateLimit?: number;
}

export interface DashboardSummaryResponse {
    analytics?: DashboardAnalytics | null;
    profile?: DashboardProfile | null;
}

export function buildSummaryUrl(login?: string): string {
    if (!login) return API_ENDPOINTS.SUMMARY;
    return `${API_ENDPOINTS.SUMMARY}?login=${encodeURIComponent(login)}`;
}

export async function fetchDashboardSummary(
    session: Session,
    login?: string
): Promise<DashboardSummaryResponse> {
    return apiFetch<DashboardSummaryResponse>(buildSummaryUrl(login ?? session.login), session);
}
