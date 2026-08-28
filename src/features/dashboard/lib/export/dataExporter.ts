import { API_ENDPOINTS, STATUS_PAGE_URL } from '@/core/config/config';
import type { Session } from '@/core/config/config';
import { withApiCredentials, fetchRevealApiKey } from '@/core/api/auth';
import { absoluteAssetUrl, appPath, legalPath } from '@/core/config/paths';
import { buildReportHtml } from './exporterTemplate';
import type { Translations } from '@/core/i18n/locales/es';
import { getBcp47 } from '@/core/i18n/I18nContext';
import { buildCommandRows } from './exporterCommandRows';
import type { AnalyticsData } from './exporterData';
import { escapeHtml, getExportSiteOrigin, maskKey } from './exporterUtils';
import { buildAnalyticsCsv } from './exporterCsv';

interface ExportUserInfo {
    followers?: number | string;
    broadcaster_type?: string;
    created_at?: string;
    description?: string;
    rateLimit?: number;
    timezone?: string;
    discordId?: string | null;
    discordUsername?: string | null;
}

export async function resolveExportApiKey(
    includeApiKey: boolean,
    reveal: () => Promise<{ apiKey: string }> = fetchRevealApiKey
): Promise<string> {
    if (!includeApiKey) return 'TU_API_KEY';
    try {
        return (await reveal()).apiKey || 'TU_API_KEY';
    } catch {
        return 'TU_API_KEY';
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const DataExport = {
    async fetchAnalytics(_session: Session): Promise<AnalyticsData> {
        try {
            const res = await fetch(API_ENDPOINTS.ANALYTICS, withApiCredentials());
            if (res.ok) {
                const body = await res.json() as { analytics?: AnalyticsData };
                return body.analytics ?? {};
            }
        } catch (error) {
            console.error('[DataExport] Error fetching analytics:', error);
        }
        return {};
    },


    async fetchUserInfo(session: Session): Promise<ExportUserInfo> {
        try {
            const url = `${API_ENDPOINTS.USER_INFO}?login=${encodeURIComponent(session.login ?? '')}`;
            const res = await fetch(url, withApiCredentials());
            if (res.ok) {
                const data = await res.json() as Record<string, unknown>;
                return {
                    followers: (data.followers ?? data.follower_count) as number | undefined,
                    broadcaster_type: data.broadcaster_type as string | undefined,
                    created_at: (data.created_at ?? data.createdAt) as string | undefined,
                    description: data.description as string | undefined,
                    rateLimit: (data.rateLimit ?? data.rate_limit ?? 120) as number,
                    timezone: data.timezone as string | undefined,
                    discordId: data.discordId as string | null | undefined,
                    discordUsername: data.discordUsername as string | null | undefined,
                };
            }
        } catch (error) {
            console.error('[DataExport] Error fetching user info:', error);
        }
        return {
            followers: undefined,
            broadcaster_type: '---',
            created_at: '---',
            description: '---',
            rateLimit: 120
        };
    },

    async fetchActivity(): Promise<unknown[]> {
        try {
            const res = await fetch(API_ENDPOINTS.ACTIVITY, withApiCredentials());
            if (res.ok) return await res.json();
        } catch (error) {
            console.error('[DataExport] Error fetching activity:', error);
        }
        return [];
    },

    async export(
        session: Session,
        t: Translations,
        locale: string,
        onSuccess?: (message: string) => void,
        options: { includeApiKey?: boolean } = {}
    ) {
        const bcp47 = getBcp47(locale);
        const user = session;
        const name = escapeHtml(user.displayName || user.login || 'Usuario');
        const safeLogin = escapeHtml(user.login || '---');
        const safeUserId = escapeHtml(user.userId || '---');
        const safeAvatarUrl = escapeHtml(user.profile_image_url || '');
        const now = new Date();
        const dateStr = now.toLocaleDateString(bcp47, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString(bcp47);

        const [userInfo, analytics, activity] = await Promise.all([
            this.fetchUserInfo(session),
            this.fetchAnalytics(session),
            this.fetchActivity()
        ]);

        const apiKey = await resolveExportApiKey(options.includeApiKey === true);
        const maskedKey = options.includeApiKey === true ? maskKey(apiKey) : 'No incluida';

        const todayRequests = (analytics.todayRequests as number) ?? (analytics.today_req_raw as number) ?? 0;
        const totalRequests = (analytics.totalRequests as number) ?? (analytics.total_requests as number) ?? 0;
        const averageLatency = (analytics.averageLatency as string) ?? '0ms';
        const successRate = (analytics.successRate as string) ?? '100%';

        const timeSeries = (analytics.timeSeries as Array<{ command_name: string; requests_count: number }>) ?? [];
        const seriesCount: Record<string, number> = {};
        for (const row of timeSeries) {
            seriesCount[row.command_name] = (seriesCount[row.command_name] ?? 0) + (row.requests_count ?? 0);
        }

        const analyticsAggregated: AnalyticsData = { ...analytics, ...seriesCount };

        const getCount = (key: string): number =>
            ((seriesCount[key] ?? 0) || (analytics[key] as number) || (analytics[`${key}_count`] as number) || 0);

        const safeDescription = escapeHtml(userInfo.description || '—');

        const channelType =
            userInfo.broadcaster_type === 'partner'
                ? 'Partner'
                : userInfo.broadcaster_type === 'affiliate'
                    ? 'Afiliado'
                    : 'Estándar';

        const followerCount =
            typeof userInfo.followers === 'number'
                ? userInfo.followers.toLocaleString(bcp47)
                : (userInfo.followers ?? '—');

        const createdAtDate = new Date(userInfo.created_at || now);
        const createdAtStr = isNaN(createdAtDate.getTime())
            ? '---'
            : createdAtDate.toLocaleDateString(bcp47, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

        const cmdTotal =
            getCount('clips') + getCount('followage') +
            getCount('watchtime') + getCount('so');
        const toolTotal =
            getCount('stalker') + getCount('trends') + getCount('roulette');
        const gameTotal =
            getCount('russian') + getCount('magic8') +
            getCount('duel') + getCount('slots');

        const reportId = `${safeLogin}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        const commandRows = buildCommandRows(analyticsAggregated, apiKey);
        const siteOrigin = getExportSiteOrigin();
        const homeUrl = `${siteOrigin}${appPath('/')}`;
        const docsUrl = `${siteOrigin}${appPath('/docs')}`;
        const dashboardUrl = `${siteOrigin}${appPath('/dashboard')}`;
        const aboutUrl = `${siteOrigin}${appPath('/about')}`;
        const logoUrl = absoluteAssetUrl('/img/logo.svg', siteOrigin);

        const statusUrl = STATUS_PAGE_URL;
        const siteLabel = 'www.losperris.dev';
        const siteUrl = 'https://www.losperris.dev';
        const discordUrl = 'https://discord.gg/PJbExZe7Tp';
        const legalPrivacy = `${siteOrigin}${legalPath('privacidad')}`;
        const legalTerms = `${siteOrigin}${legalPath('terminos')}`;
        const legalStorage = `${siteOrigin}${legalPath('almacenamiento')}`;
        const year = now.getFullYear();

        const html = buildReportHtml({
            name, safeLogin, safeUserId, safeAvatarUrl,
            dateStr, timeStr, year, reportId, channelType,
            followerCount, createdAtStr, safeDescription,
            maskedKey, todayRequests, totalRequests, averageLatency,
            successRate, cmdTotal, toolTotal, gameTotal,
            rateLimit: userInfo.rateLimit || 120, commandRows,
            homeUrl, docsUrl, dashboardUrl, aboutUrl, logoUrl,
            faviconUrl: logoUrl, statusUrl, siteLabel, siteUrl,
            discordUrl, legalPrivacy, legalTerms, legalStorage,
            snapshotJson: JSON.stringify({
                exportedAt: now.toISOString(),
                profile: {
                    login: user.login,
                    userId: user.userId,
                    displayName: user.displayName,
                    timezone: userInfo.timezone,
                    discordId: userInfo.discordId,
                    discordUsername: userInfo.discordUsername
                },
                analytics,
                dailyStats: analytics.timeSeries ?? [],
                activity
            }).replace(/</g, '\\u003c')
        }, t);

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        downloadBlob(blob, `MisDatos_LosPerrisAPI_${user.login || 'usuario'}.html`);

        onSuccess?.(t.settings.toasts.exportSuccess);
    },

    async exportCsv(
        session: Session,
        t: Translations,
        onSuccess?: (message: string) => void
    ) {
        const [analytics, userInfo] = await Promise.all([
            this.fetchAnalytics(session),
            this.fetchUserInfo(session)
        ]);
        const now = new Date();
        const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const csv = buildAnalyticsCsv(analytics, {
            login: session.login || 'usuario',
            exportedAt: now.toISOString(),
            timezone: userInfo.timezone || 'UTC'
        });
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, `Analytics_LosPerrisAPI_${session.login || 'usuario'}_${dateTag}.csv`);
        onSuccess?.(t.settings.toasts.exportSuccess);
    }
};

export { DataExport };
