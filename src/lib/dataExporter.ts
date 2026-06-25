import { API_ENDPOINTS } from '@/lib/config';
import type { Session } from '@/lib/config';
import { buildAuthQueryParam } from '@/lib/authQuery';
import { appUrl } from '@/lib/paths';

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
        label: '⚔️ Duelo 1v1',
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

const getAuthParts = (session: Session) => ({
    query: buildAuthQueryParam(session),
    headers: session.token
        ? { Authorization: `Bearer ${session.token}` }
        : ({} as Record<string, string>)
});

const DataExport = {
    async fetchAnalytics(session: Session): Promise<AnalyticsData> {
        try {
            const { query, headers } = getAuthParts(session);
            const queryParam = query ? `?${query}` : '';
            const res = await fetch(`${API_ENDPOINTS.ANALYTICS}${queryParam}`, {
                headers
            });
            if (res.ok) return await res.json();
        } catch (error) {
            console.error('[DataExport] Error fetching analytics:', error);
        }
        return {};
    },

    async fetchUserInfo(session: Session) {
        try {
            const { query, headers } = getAuthParts(session);
            const url = `${API_ENDPOINTS.USER_INFO}?login=${encodeURIComponent(session.login ?? '')}&${query}`;
            const res = await fetch(url, { headers });
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
            return 'https://api.losperris.com/api/twitch';
        }
        return `${protocol}//${host}/api/twitch`;
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
                            <div class="bot-syntax">
                                <span class="bot-name">cURL</span>
                                <div class="code-block">curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${variantBody}'</div>
                            </div>
                            <div class="bot-syntax">
                                <span class="bot-name">Fetch (JS)</span>
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
                            <div class="bot-syntax">
                                <span class="bot-name">Nightbot</span>
                                <div class="code-block">$(urlfetch ${fullUrl})</div>
                            </div>
                            <div class="bot-syntax">
                                <span class="bot-name">StreamElements</span>
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
                            <h3>${cmd.label}${method === 'POST' ? '<span class="method-post">POST</span>' : ''}${isDashboard ? '<span class="method-post" style="background:rgba(59,130,246,0.12);color:var(--info)">DASHBOARD</span>' : ''}</h3>
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

    async export(session: Session, onSuccess?: (message: string) => void) {
        const user = session;
        const name = this.escapeHtml(user.displayName || user.login || 'Usuario');
        const safeLogin = this.escapeHtml(user.login || '---');
        const safeUserId = this.escapeHtml(user.userId || '---');
        const safeAvatarUrl = this.escapeHtml(user.profile_image_url || '');
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('es-ES');

        const userInfo = await this.fetchUserInfo(session);
        const analytics = await this.fetchAnalytics(session);

        const apiKey = user.apiKey || user.token || '';
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
                : userInfo.followers;

        const createdAtDate = new Date(userInfo.created_at || now);
        const createdAtStr = isNaN(createdAtDate.getTime())
            ? '---'
            : createdAtDate.toLocaleDateString('es-ES', {
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
        const dashboardUrl = appUrl('/dashboard');
        const healthUrl = `${this.getApiBaseUrl()}/health`;

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte — ${name} · LosPerris API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #000000;
            --surface: #09090b;
            --surface2: #18181b;
            --border: #27272a;
            --border2: #27272a;
            --accent: #9146ff;
            --accent-light: #a78bfa;
            --accent-glow: rgba(145,70,255,0.05);
            --text: #fafafa;
            --text-muted: #a1a1aa;
            --text-dim: #71717a;
            --success: #22c55e;
            --success-bg: rgba(34,197,94,0.1);
            --warning: #f59e0b;
            --warning-bg: rgba(245,158,11,0.1);
            --info: #3b82f6;
            --info-bg: rgba(59,130,246,0.1);
        }
        body {
            font-family: 'Geist', -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 2rem 1rem;
            line-height: 1.5;
        }
        .container { max-width: 760px; margin: 0 auto; }
        .top-banner {
            height: 4px;
            background: var(--accent);
            border-radius: 4px 4px 0 0;
        }
        .header {
            background: var(--surface);
            border: 1px solid var(--border);
            border-top: none;
            border-radius: 0 0 16px 16px;
            padding: 1.8rem 2rem;
            margin-bottom: 1.2rem;
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        .header-avatar {
            width: 76px; height: 76px;
            border-radius: 50%;
            border: 2px solid var(--border);
            object-fit: cover;
            flex-shrink: 0;
        }
        .header-avatar-placeholder {
            width: 76px; height: 76px;
            border-radius: 50%;
            background: var(--surface2);
            border: 3px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.8rem; flex-shrink: 0;
        }
        .header-info { flex: 1; min-width: 0; }
        .header-name {
            font-size: 1.6rem; font-weight: 800; color: var(--text);
        }
        .header-login { color: var(--text-muted); font-size: 0.85rem; margin-top: 0.1rem; }
        .header-chips { display: flex; gap: 0.5rem; margin-top: 0.7rem; flex-wrap: wrap; }
        .chip {
            display: inline-flex; align-items: center; gap: 0.25rem;
            padding: 0.2rem 0.6rem; border-radius: 20px;
            font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em;
        }
        .chip-purple { background: rgba(145,70,255,0.1); color: var(--accent); border: 1px solid rgba(145,70,255,0.2); }
        .chip-green  { background: var(--success-bg); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
        .chip-blue   { background: var(--info-bg); color: var(--info); border: 1px solid rgba(59,130,246,0.2); }
        .header-right { text-align: right; flex-shrink: 0; }
        .report-id { font-size: 0.62rem; color: var(--text-dim); font-family: monospace; letter-spacing: 0.05em; }
        .report-date { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; }

        .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.7rem; margin-bottom: 1.2rem; }
        .qs-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0.9rem; text-align: center; }
        .qs-val { font-size: 1.4rem; font-weight: 800; color: var(--accent-light); line-height: 1; margin-bottom: 0.25rem; }
        .qs-lbl { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

        .section { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 1.1rem; }
        .section-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.4rem; border-bottom: 1px solid var(--border2); background: var(--surface2); }
        .section-icon { width: 26px; height: 26px; background: var(--accent-glow); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .section-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-light); }
        .section-body { padding: 1.1rem 1.4rem; }

        .row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border2); }
        .row:last-child { border-bottom: none; }
        .row-label { color: var(--text-muted); font-size: 0.82rem; font-weight: 500; }
        .row-value { color: var(--text); font-size: 0.82rem; font-weight: 600; text-align: right; max-width: 60%; word-break: break-all; }
        .badge { display: inline-block; background: var(--accent-glow); color: var(--accent-light); padding: 0.18rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; border: 1px solid rgba(124,58,237,0.25); }
        .badge-green { background: var(--success-bg); color: var(--success); border-color: rgba(16,185,129,0.25); }
        .masked { font-family: monospace; letter-spacing: 1px; color: var(--text-muted); }

        .security-banner {
            background: rgba(245,158,11,0.08);
            border: 1px solid rgba(245,158,11,0.25);
            border-radius: 10px;
            padding: 0.85rem 1.1rem;
            margin-bottom: 1.1rem;
            display: flex;
            align-items: flex-start;
            gap: 0.65rem;
        }
        .security-banner .sb-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 0.1rem; }
        .security-banner .sb-text { font-size: 0.73rem; color: var(--warning); line-height: 1.45; }
        .security-banner .sb-text strong { color: #fbbf24; }

        .dashboard-only-badge {
            display: inline-flex; align-items: center; gap: 0.3rem;
            margin-top: 0.5rem; padding: 0.25rem 0.55rem;
            background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
            border-radius: 6px; font-size: 0.65rem; color: var(--info);
            font-weight: 600;
        }

        .method-post {
            display: inline-block;
            background: rgba(245,158,11,0.12);
            color: var(--warning);
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 0.07em;
            margin-left: 0.35rem;
            vertical-align: middle;
        }

        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
        .metric-card { background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 1rem; }
        .metric-val { font-size: 1.35rem; font-weight: 800; margin-bottom: 0.2rem; }
        .metric-lbl { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; }
        .mv-purple { color: var(--accent-light); }
        .mv-green  { color: var(--success); }
        .mv-yellow { color: var(--warning); }
        .mv-blue   { color: var(--info); }

        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.7rem; margin-top: 0.8rem; }
        .cat-card { background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 0.85rem; text-align: center; }
        .cat-icon { font-size: 1.1rem; margin-bottom: 0.3rem; }
        .cat-val { font-size: 1.1rem; font-weight: 800; color: var(--accent-light); margin-bottom: 0.15rem; }
        .cat-lbl { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; }

        .commands-container { display: flex; flex-direction: column; gap: 0.9rem; }
        .command-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .cmd-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.1rem; border-bottom: 1px solid var(--border2); }
        .cmd-title h3 { font-size: 0.95rem; color: var(--text); margin-bottom: 0.12rem; font-weight: 700; }
        .cmd-title p { font-size: 0.73rem; color: var(--text-muted); }
        .cmd-stat { display: flex; flex-direction: column; align-items: flex-end; }
        .cmd-stat .s-val { font-size: 1.25rem; font-weight: 800; color: var(--accent-light); line-height: 1; }
        .cmd-stat .s-lbl { font-size: 0.58rem; color: var(--text-dim); letter-spacing: 0.08em; margin-top: 0.15rem; text-transform: uppercase; }
        .cmd-variants { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .variant-box { background: var(--bg); border: 1px solid var(--border2); border-radius: 8px; padding: 0.75rem; }
        .v-header { margin-bottom: 0.5rem; }
        .v-name { font-size: 0.8rem; font-weight: 700; color: var(--text); display: block; }
        .v-desc { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.12rem; }
        .bot-syntax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 0.6rem; }
        .bot-syntax { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
        .bot-name { font-size: 0.65rem; color: var(--accent-light); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; }
        .code-block {
            background: #06060a; color: #c4b5fd;
            font-family: 'Courier New', monospace; font-size: 0.72rem;
            padding: 0.55rem 0.75rem; border-radius: 6px;
            border: 1px solid var(--border);
            word-break: break-all; white-space: pre-wrap;
            user-select: all; line-height: 1.4;
        }
        @media(max-width: 580px) {
            .bot-syntax-grid, .metrics-grid { grid-template-columns: 1fr; }
            .quick-stats, .cat-grid { grid-template-columns: 1fr 1fr; }
            .header { flex-direction: column; text-align: center; }
            .header-right { text-align: center; }
            .header-chips { justify-content: center; }
        }
        @media print {
            body { background: #fff; color: #111; padding: 1rem; font-size: 11px; }
            .top-banner, .security-banner, .code-block, .bot-syntax-grid, .cmd-variants,
            .section-icon, .footer a, .header-chips, .chip, .dashboard-only-badge { display: none; }
            .header, .section, .qs-card, .metric-card, .cat-card, .command-card, .variant-box {
                background: #fff; border: 1px solid #ccc; box-shadow: none;
            }
            .section-head { background: #f5f5f5; border-bottom: 1px solid #ccc; }
            .section-title { color: #333; }
            .qs-val, .cat-val, .metric-val, .cmd-stat .s-val { color: #111; }
            .header-name { -webkit-text-fill-color: #111; }
            .header-avatar { box-shadow: none; }
            .row-label, .qs-lbl, .cat-lbl, .metric-lbl, .cmd-stat .s-lbl,
            .report-date, .header-login, .report-id { color: #555; }
            .container { max-width: 100%; }
            .quick-stats { grid-template-columns: repeat(4, 1fr); }
            .footer { border-top-color: #ccc; color: #555; }
        }
        .footer { text-align: center; margin-top: 2rem; padding-top: 1.4rem; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 0.7rem; line-height: 2; }
        .footer a { color: var(--accent-light); text-decoration: none; }
        .footer-brand { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.2rem; }
    </style>
</head>
<body>
<div class="container">

    <div class="top-banner"></div>

    <div class="header">
        ${
            safeAvatarUrl
                ? `<img src="${safeAvatarUrl}" alt="Avatar" class="header-avatar">`
                : `<div class="header-avatar-placeholder">👤</div>`
        }
        <div class="header-info">
            <div class="header-name">${name}</div>
            <div class="header-login">@${safeLogin}</div>
            <div class="header-chips">
                <span class="chip chip-purple">${channelType}</span>
                <span class="chip chip-green">✓ API Activa</span>
                <span class="chip chip-blue">LosPerris API</span>
            </div>
        </div>
        <div class="header-right">
            <div class="report-id">ID: ${reportId}</div>
            <div class="report-date">${dateStr}</div>
            <div class="report-date">${timeStr}</div>
        </div>
    </div>

    <div class="security-banner">
        <span class="sb-icon">⚠️</span>
        <span class="sb-text">
            <strong>Este reporte contiene tu API Key.</strong>
            No lo compartas públicamente ni lo subas a redes sociales, streams o sitios web. Cualquiera con acceso a este archivo puede usar tu API Key para hacer peticiones en tu nombre.
        </span>
    </div>

    <div class="quick-stats">
        <div class="qs-card">
            <div class="qs-val">${followerCount}</div>
            <div class="qs-lbl">Seguidores</div>
        </div>
        <div class="qs-card">
            <div class="qs-val">${todayRequests.toLocaleString()}</div>
            <div class="qs-lbl">Hoy</div>
        </div>
        <div class="qs-card">
            <div class="qs-val">${(totalRequests as number).toLocaleString()}</div>
            <div class="qs-lbl">Total</div>
        </div>
        <div class="qs-card">
            <div class="qs-val">${successRate}</div>
            <div class="qs-lbl">Éxito</div>
        </div>
    </div>

    <div class="section">
        <div class="section-head">
            <div class="section-icon">👤</div>
            <span class="section-title">Información de Perfil</span>
        </div>
        <div class="section-body">
            <div class="row"><span class="row-label">Nombre</span><span class="row-value">${name}</span></div>
            <div class="row"><span class="row-label">Login</span><span class="row-value">@${safeLogin}</span></div>
            <div class="row"><span class="row-label">ID de Usuario</span><span class="row-value">${safeUserId}</span></div>
            <div class="row"><span class="row-label">Tipo de Canal</span><span class="row-value"><span class="badge">${channelType}</span></span></div>
            <div class="row"><span class="row-label">Miembro desde</span><span class="row-value">${createdAtStr}</span></div>
            <div class="row"><span class="row-label">Biografía</span><span class="row-value">${safeDescription}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-head">
            <div class="section-icon">🔐</div>
            <span class="section-title">Seguridad y Acceso</span>
        </div>
        <div class="section-body">
            <div class="row"><span class="row-label">API Key</span><span class="row-value masked">${maskedKey}</span></div>
            <div class="row"><span class="row-label">Estado</span><span class="row-value"><span class="badge badge-green">✓ Activa</span></span></div>
            <div class="row"><span class="row-label">Límite de Peticiones</span><span class="row-value">${userInfo.rateLimit || 120} req/min</span></div>
            <div class="row"><span class="row-label">Nivel de Acceso</span><span class="row-value">Full API</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-head">
            <div class="section-icon">📊</div>
            <span class="section-title">Métricas de Rendimiento</span>
        </div>
        <div class="section-body">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-val mv-purple">${todayRequests.toLocaleString()}</div>
                    <div class="metric-lbl">Peticiones hoy</div>
                </div>
                <div class="metric-card">
                    <div class="metric-val mv-blue">${(totalRequests as number).toLocaleString()}</div>
                    <div class="metric-lbl">Peticiones totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-val mv-yellow">${averageLatency}</div>
                    <div class="metric-lbl">Latencia promedio</div>
                </div>
                <div class="metric-card">
                    <div class="metric-val mv-green">${successRate}</div>
                    <div class="metric-lbl">Tasa de éxito</div>
                </div>
            </div>
            <div class="cat-grid">
                <div class="cat-card">
                    <div class="cat-icon">🖥️</div>
                    <div class="cat-val">${cmdTotal.toLocaleString()}</div>
                    <div class="cat-lbl">Comandos</div>
                </div>
                <div class="cat-card">
                    <div class="cat-icon">🔧</div>
                    <div class="cat-val">${toolTotal.toLocaleString()}</div>
                    <div class="cat-lbl">Herramientas</div>
                </div>
                <div class="cat-card">
                    <div class="cat-icon">🎮</div>
                    <div class="cat-val">${gameTotal.toLocaleString()}</div>
                    <div class="cat-lbl">Minijuegos</div>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-head">
            <div class="section-icon">⚙️</div>
            <span class="section-title">Integraciones de Comandos</span>
        </div>
        <div class="section-body">
            <div class="commands-container">
                ${commandRows || '<p style="text-align:center;color:var(--text-dim);padding:1rem">Aún no hay comandos registrados.</p>'}
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-brand">LosPerris API</div>
        <div>Reporte generado el <strong>${dateStr}</strong> a las <strong>${timeStr}</strong></div>
        <div>ID del reporte: <code>${reportId}</code></div>
        <div style="margin-top:0.5rem">
            <a href="${dashboardUrl}" target="_blank">Abrir Dashboard</a>
            &nbsp;·&nbsp;
            <a href="${healthUrl}" target="_blank">Estado del Sistema</a>
        </div>
    </div>

</div>
</body>
</html>`;

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
