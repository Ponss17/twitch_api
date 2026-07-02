import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';

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
    cacheTtl?: number;
    role?: string;
    roleLabel?: string;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
}

interface DashboardSummaryResponse {
    analytics?: DashboardAnalytics | null;
}

function buildSummaryUrl(login?: string): string {
    if (!login) return API_ENDPOINTS.SUMMARY;
    return `${API_ENDPOINTS.SUMMARY}?login=${encodeURIComponent(login)}`;
}

export async function fetchDashboardSummary(
    session: Session,
    login?: string,
    options?: { fresh?: boolean }
): Promise<DashboardSummaryResponse> {
    let url = buildSummaryUrl(login ?? session.login);
    if (options?.fresh) {
        url += `${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
    }
    return apiFetch<DashboardSummaryResponse>(url, session);
}

export async function fetchDashboardProfile(
    session: Session,
    options?: { fresh?: boolean }
): Promise<DashboardProfile> {
    const login = session.login ?? '';
    let url = `${API_ENDPOINTS.USER_INFO}?login=${encodeURIComponent(login)}`;
    if (options?.fresh) {
        url += `&_=${Date.now()}`;
    }
    return apiFetch<DashboardProfile>(url, session);
}
