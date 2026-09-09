import { API_ENDPOINTS } from '@/core/config/config';
import type { Session } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';

export interface MonthlyReportSummary {
    yearMonth: string;
    timezone: string;
    totalRequests: number;
    totalErrors: number;
    successRate: number;
    avgLatencyMs: number;
    uniqueCommands: number;
    commands: Array<{
        name: string;
        requests: number;
        errors: number;
        avgLatencyMs: number;
    }>;
    daily: Array<{ date: string; requests: number; errors: number }>;
    topViewers: Array<{ user_name: string; total: number; last_seen: string }>;
    previous?: {
        yearMonth: string;
        totalRequests: number;
        successRate: number;
        avgLatencyMs: number;
        requestsDelta: number;
    } | null;
}

export interface MonthlyReportListItem {
    id: string;
    yearMonth: string;
    createdAt: string;
    totalRequests: number;
    successRate: number;
}

export interface MonthlyReportDetail {
    id: string;
    yearMonth: string;
    createdAt: string;
    summary: MonthlyReportSummary;
}

export interface ServerNotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    payload: { reportId?: string; yearMonth?: string; [key: string]: unknown };
    read_at: string | null;
    created_at: string;
}

export async function ensureMonthlyReport(session: Session): Promise<void> {
    await apiFetch(
        API_ENDPOINTS.MONTHLY_REPORTS_ENSURE,
        session,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        },
        { logoutOn401: false }
    );
}

export async function fetchMonthlyReports(session: Session): Promise<MonthlyReportListItem[]> {
    const data = await apiFetch<{ reports?: MonthlyReportListItem[] }>(
        API_ENDPOINTS.MONTHLY_REPORTS,
        session,
        {},
        { logoutOn401: false }
    );
    return data.reports ?? [];
}

export async function fetchMonthlyReport(
    session: Session,
    yearMonth: string
): Promise<MonthlyReportDetail> {
    return apiFetch<MonthlyReportDetail>(
        `${API_ENDPOINTS.MONTHLY_REPORTS}${encodeURIComponent(yearMonth)}/`,
        session,
        {},
        { logoutOn401: false }
    );
}

export async function fetchServerNotifications(session: Session): Promise<{
    notifications: ServerNotification[];
    unreadCount: number;
}> {
    const data = await apiFetch<{ notifications?: ServerNotification[]; unreadCount?: number }>(
        API_ENDPOINTS.NOTIFICATIONS,
        session,
        {},
        { logoutOn401: false }
    );
    return {
        notifications: data.notifications ?? [],
        unreadCount: data.unreadCount ?? 0
    };
}

export async function markServerNotificationRead(session: Session, id: string): Promise<void> {
    await apiFetch(
        `${API_ENDPOINTS.NOTIFICATIONS}${encodeURIComponent(id)}/read/`,
        session,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        },
        { logoutOn401: false }
    );
}

export async function markAllServerNotificationsRead(session: Session): Promise<void> {
    await apiFetch(
        API_ENDPOINTS.NOTIFICATIONS_READ_ALL,
        session,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        },
        { logoutOn401: false }
    );
}
