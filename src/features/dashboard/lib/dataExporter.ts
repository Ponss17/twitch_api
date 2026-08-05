import { API_ENDPOINTS, STATUS_PAGE_URL } from '@/core/config/config';
import type { Session } from '@/core/config/config';
import { withApiCredentials, fetchRevealApiKey } from '@/core/api/auth';
import { absoluteAssetUrl, appPath, legalPath } from '@/core/config/paths';
import { buildReportHtml } from './exporterTemplate';
import type { Translations } from '@/core/i18n/locales/es';
import { getBcp47 } from '@/core/i18n/I18nContext';

interface AnalyticsData {
    todayRequests?: number;
    totalRequests?: number;
    averageLatency?: string;
    successRate?: string;
    [key: string]: number | string | undefined;
}

const COMMAND_INTEGRATIONS = [
    {
        id: 'clips',
        label: '🎬 Buscador de Clips',
        description: 'Busca el clip más popular o reciente del canal',
        variants: [
            {
                name: 'Clip Directo (URL)',
                params: 'channel=$(channel)',
                desc: 'Obtiene únicamente el link del clip'
            },
            {
                name: 'Clip con Mensaje Personalizado',
                params: 'channel=$(channel)&template=Mirá%20este%20clip%20épico:%20{url}',
                desc: 'Devuelve un texto incluyendo el link del clip'
            }
        ]
    },
    {
        id: 'message',
        label: '💬 Enviar Mensaje al Chat',
        description: 'Envía un mensaje al chat de tu canal mediante la API',
        method: 'POST' as const,
        variants: [
            {
                name: 'Mensaje Simple',
                params: '',
                body: '{"message":"Hola chat!"}',
                desc: 'Envía un mensaje de texto plano (máx 500 caracteres)'
            },
            {
                name: 'Mensaje con Variables de Bot',
                params: '',
                body: '{"message":"$(user) acaba de usar el comando!"}',
                desc: 'Incluye variables del bot en el mensaje'
            }
        ]
    },
    {
        id: 'followage',
        label: '⌛ Followage (Tiempo de Seguimiento)',
        description: 'Muestra cuánto tiempo lleva alguien siguiendo',
        variants: [
            {
                name: 'Texto por Defecto',
                params: 'channel=$(channel)&user=$(touser)',
                desc: 'Texto estándar de la API'
            },
            {
                name: 'Plantilla Personalizada',
                params: 'channel=$(channel)&user=$(touser)&template={user}%20lleva%20{time}%20bancando%20a%20{channel}',
                desc: 'Personaliza tu propia respuesta ({time}, {user}, {channel})'
            }
        ]
    },
    {
        id: 'so',
        label: '📢 Shoutout (Promoción)',
        description: 'Promociona a otro streamer en el chat',
        variants: [
            {
                name: 'Shoutout Estándar',
                params: 'channel=$(channel)&touser=$(touser)',
                desc: 'Muestra la última categoría y enlace del streamer'
            },
            {
                name: 'Shoutout Personalizado',
                params: 'channel=$(channel)&touser=$(touser)&template=Vayan%20a%20seguir%20a%20{user},%20estuvo%20jugando%20{game}!%20{url}',
                desc: 'Plantilla a medida ({user}, {game}, {url})'
            }
        ]
    },
    {
        id: 'magic8',
        label: '🎱 Bola 8 Mágica',
        description: 'Responde preguntas con la IA de LosPerris',
        variants: [
            {
                name: 'Bola 8 Clásica',
                params: 'question=$(query)&user=$(user)&mood=classic',
                desc: 'Respuestas solemnes y místicas'
            },
            {
                name: 'Bola 8 Sarcástica',
                params: 'question=$(query)&user=$(user)&mood=sarcastic',
                desc: 'Respuestas cínicas y condescendientes'
            },
            {
                name: 'Bola 8 Tóxica',
                params: 'question=$(query)&user=$(user)&mood=toxic',
                desc: 'Respuestas posesivas y manipuladoras'
            },
            {
                name: 'Bola 8 Amable',
                params: 'question=$(query)&user=$(user)&mood=helpful',
                desc: 'Respuestas dulces y motivacionales'
            }
        ]
    },
    {
        id: 'russian',
        label: '🔫 Ruleta Rusa',
        description: 'Un minijuego de riesgo de baneo/timeout',
        variants: [
            {
                name: 'Modo Normal (Chat)',
                params: 'channel=$(channel)&user=$(user)',
                desc: 'Juego de texto, ideal para que el bot responda directamente'
            },
            {
                name: 'Modo Hardcore',
                params: 'channel=$(channel)&user=$(user)&hardcore=true',
                desc: 'Aumenta las probabilidades de fallar'
            },
            {
                name: 'Silencioso (Para Action/JSON)',
                params: 'channel=$(channel)&user=$(user)&format=json',
                desc: 'Devuelve un objeto JSON para bots avanzados'
            }
        ]
    },
    {
        id: 'duel',
        label: 'Duelo 1v1',
        description: 'Peleas a muerte entre dos espectadores',
        variants: [
            {
                name: 'Duelo Estándar',
                params: 'challenger=$(user)&target=$(touser)',
                desc: 'Enfrenta al usuario actual contra quien mencione'
            }
        ]
    },
    {
        id: 'roulette',
        label: '🎰 Ruleta Casino',
        description: 'Minijuego de suerte',
        variants: [
            {
                name: 'Jugar Ruleta',
                params: 'channel=$(channel)&user=$(user)',
                desc: 'Apuestas de suerte estándar'
            }
        ]
    },
    {
        id: 'stalker',
        label: '🔍 Stalker (Escáner de Viewers)',
        description: 'Analiza la lista de espectadores del canal (solo Dashboard)',
        dashboard: true,
        variants: [
            {
                name: 'Dashboard',
                params: '',
                desc: 'Herramienta exclusiva del panel de control — escanea viewers, detecta lurkers, mods y VIPs'
            }
        ]
    },
    {
        id: 'trends',
        label: '📈 Trends (Tendencias de Chat)',
        description: 'Rastrea palabras y frases más usadas en el chat (solo Dashboard)',
        dashboard: true,
        variants: [
            {
                name: 'Dashboard',
                params: '',
                desc: 'Herramienta exclusiva del panel de control — monitorea tendencias en tiempo real del chat'
            }
        ]
    }
];

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

    maskKey(key: string) {
        if (key.length <= 8) return '••••••••';
        return key.slice(0, 4) + '••••••••' + key.slice(-4);
    },

    /** Escapa entidades HTML para evitar XSS al abrir el reporte exportado. */
    escapeHtml(value: unknown): string {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    getApiBaseUrl() {
        const { protocol, host } = window.location;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return 'https://ttv.losperris.dev';
        }
        return `${protocol}//${host}/api/twitch`;
    },

    /** Origen absoluto para enlaces del reporte (funciona al abrir el .html fuera del sitio). */
    getExportSiteOrigin() {
        const { host } = window.location;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return 'https://ttv.losperris.dev';
        }
        return window.location.origin;
    },

    buildCommandRows(analytics: AnalyticsData, apiKey: string) {
        const rows: string[] = [];
        const apiBaseUrl = this.getApiBaseUrl();

        for (const cmd of COMMAND_INTEGRATIONS) {
            const count = analytics[cmd.id] || 0;
            const countStr = typeof count === 'number' ? count.toLocaleString() : count;

            const getPath = (id: string) => {
                const paths: Record<string, string> = {
                    clips: '/dashboard/get-clips',
                    followage: '/followage',
                    message: '/send-message',
                    so: '/shoutout',
                    magic8: '/minigames/magic8',
                    russian: '/minigames/russian',
                    duel: '/minigames/duel',
                    roulette: '/minigames/roulette',
                    stalker: '',
                    trends: ''
                };
                return paths[id] || `/${id}`;
            };

            const method = (cmd as Record<string, unknown>).method === 'POST' ? 'POST' : 'GET';
            const isDashboard = !!(cmd as Record<string, unknown>).dashboard;
            const path = getPath(cmd.id);
            let variantsHtml = '';

            for (const variant of cmd.variants) {
                const fullUrl = isDashboard
                    ? ''
                    : `${apiBaseUrl}${path}${variant.params ? `?${variant.params}&apiKey=${apiKey}` : `?apiKey=${apiKey}`}`;
                const variantBody = (variant as Record<string, string>).body || '';

                if (isDashboard) {
                    variantsHtml += `
                    <div class="variant-box dashboard-tool">
                        <div class="v-header">
                            <span class="v-name">🔒 ${variant.name}</span>
                            <span class="v-desc">${variant.desc}</span>
                        </div>
                        <div class="dashboard-only-badge">
                            <span>Solo disponible en el Dashboard</span>
                        </div>
                    </div>
                `;
                } else if (method === 'POST') {
                    variantsHtml += `
                    <div class="variant-box">
                        <div class="v-header">
                            <span class="v-name">${variant.name}</span>
                            <span class="v-desc">${variant.desc}</span>
                        </div>
                        <div class="bot-syntax-grid">
                            <div>
                                <div class="bot-name">cURL</div>
                                <div class="code-block">curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${variantBody}'</div>
                            </div>
                            <div>
                                <div class="bot-name">Fetch (JS)</div>
                                <div class="code-block">fetch("${fullUrl}", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: '${variantBody}'
})</div>
                            </div>
                        </div>
                    </div>
                `;
                } else {
                    variantsHtml += `
                    <div class="variant-box">
                        <div class="v-header">
                            <span class="v-name">${variant.name}</span>
                            <span class="v-desc">${variant.desc}</span>
                        </div>
                        <div class="bot-syntax-grid">
                            <div>
                                <div class="bot-name">Nightbot</div>
                                <div class="code-block">$(urlfetch ${fullUrl})</div>
                            </div>
                            <div>
                                <div class="bot-name">StreamElements</div>
                                <div class="code-block">\${customapi.${fullUrl}}</div>
                            </div>
                        </div>
                    </div>
                `;
                }
            }

            rows.push(`
                <div class="command-card">
                    <div class="cmd-header">
                        <div class="cmd-title">
                            <h3>${cmd.label}${method === 'POST' ? '<span class="cmd-tag tag-post">POST</span>' : ''}${isDashboard ? '<span class="cmd-tag tag-dash">DASHBOARD</span>' : ''}</h3>
                            <p>${cmd.description}</p>
                        </div>
                        <div class="cmd-stat">
                            <span class="s-val">${countStr}</span>
                            <span class="s-lbl">USOS</span>
                        </div>
                    </div>
                    <div class="cmd-variants">
                        ${variantsHtml}
                    </div>
                </div>
            `);
        }

        return rows.join('');
    },

    async export(session: Session, t: Translations, locale: string, onSuccess?: (message: string) => void) {
        const bcp47 = getBcp47(locale);
        const user = session;
        const name = this.escapeHtml(user.displayName || user.login || 'Usuario');
        const safeLogin = this.escapeHtml(user.login || '---');
        const safeUserId = this.escapeHtml(user.userId || '---');
        const safeAvatarUrl = this.escapeHtml(user.profile_image_url || '');
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
        const maskedKey = this.maskKey(apiKey);

        const todayRequests = analytics.todayRequests ?? 0;
        const totalRequests = analytics.totalRequests ?? 0;
        const averageLatency = analytics.averageLatency ?? '0ms';
        const successRate = analytics.successRate ?? '100%';

        const safeDescription = this.escapeHtml(userInfo.description || '—');

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
            ((analytics.so as number) || 0) +
            ((analytics.message as number) || 0);
        const toolTotal =
            ((analytics.stalker as number) || 0) +
            ((analytics.trends as number) || 0) +
            ((analytics.roulette as number) || 0);
        const gameTotal =
            ((analytics.russian as number) || 0) +
            ((analytics.magic8 as number) || 0) +
            ((analytics.duel as number) || 0);

        const reportId = `${safeLogin}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        const commandRows = this.buildCommandRows(analytics, apiKey);
        const siteOrigin = this.getExportSiteOrigin();
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
