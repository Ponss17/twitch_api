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

const DataExport = {
    async fetchAnalytics(_session: Session): Promise<AnalyticsData> {
        try {
            const res = await fetch(API_ENDPOINTS.ANALYTICS, withApiCredentials());
            if (res.ok) return await res.json();
        } catch (error) {
            console.error('[DataExport] Error fetching analytics:', error);
        }
        return {};
    },

    async fetchUserInfo(session: Session) {
        try {
            const url = `${API_ENDPOINTS.USER_INFO}?login=${encodeURIComponent(session.login ?? '')}`;
            const res = await fetch(url, withApiCredentials());
            if (res.ok) return await res.json();
        } catch (error) {
            console.error('[DataExport] Error fetching user info:', error);
        }
        return {
            followers: '---',
            broadcaster_type: '---',
            created_at: '---',
            description: '---',
            rateLimit: 120
        };
    },

    async export(session: Session, t: Translations, locale: string, onSuccess?: (message: string) => void) {
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

        const userInfo = await this.fetchUserInfo(session);
        const analytics = await this.fetchAnalytics(session);

        let apiKey = '';
        try {
            apiKey = (await fetchRevealApiKey()).apiKey;
        } catch {
            /* export sin key en comandos si reveal falla */
        }
        const maskedKey = maskKey(apiKey);

        const todayRequests = analytics.todayRequests ?? 0;
        const totalRequests = analytics.totalRequests ?? 0;
        const averageLatency = analytics.averageLatency ?? '0ms';
        const successRate = analytics.successRate ?? '100%';

        const safeDescription = escapeHtml(userInfo.description || '—');

        const channelType =
            userInfo.broadcaster_type === 'partner'
                ? 'Partner'
                : userInfo.broadcaster_type === 'affiliate'
                  ? 'Afiliado'
                  : 'Estándar';

        const followerCount =
            typeof userInfo.followers === 'number'
                ? userInfo.followers.toLocaleString()
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
            ((analytics.clips as number) || 0) +
            ((analytics.followage as number) || 0) +
            ((analytics.watchtime as number) || 0) +
            ((analytics.so as number) || 0) +
            ((analytics.message as number) || 0);
        const toolTotal =
            ((analytics.stalker as number) || 0) +
            ((analytics.trends as number) || 0) +
            ((analytics.roulette as number) || 0);
        const gameTotal =
            ((analytics.russian as number) || 0) +
            ((analytics.magic8 as number) || 0) +
            ((analytics.duel as number) || 0) +
            ((analytics.slots as number) || 0);

        const reportId = `${safeLogin}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        const commandRows = buildCommandRows(analytics, apiKey);
        const siteOrigin = getExportSiteOrigin();
        const homeUrl = `${siteOrigin}${appPath('/')}`;
        const docsUrl = `${siteOrigin}${appPath('/docs')}`;
        const dashboardUrl = `${siteOrigin}${appPath('/dashboard')}`;
        const aboutUrl = `${siteOrigin}${appPath('/sobre-la-api')}`;
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
            discordUrl, legalPrivacy, legalTerms, legalStorage
        }, t);

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MisDatos_LosPerrisAPI_${user.login || 'usuario'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onSuccess?.('Archivo descargado correctamente');
    }
};

export { DataExport };
