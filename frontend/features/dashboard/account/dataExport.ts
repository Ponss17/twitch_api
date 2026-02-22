import { Session } from '../../../types.js';
import { UI } from '../../../core/ui.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';

// Configuración de comandos y minijuegos con sus variantes de URLs (para Nightbot/StreamElements)
interface CommandIntegration {
    id: string;
    label: string;
    description: string;
    variants: { name: string; params: string; desc: string }[];
}

const COMMAND_INTEGRATIONS: CommandIntegration[] = [
    {
        id: 'clips',
        label: '🎥 Buscador de Clips',
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
        id: 'followage',
        label: '⏱️ Followage (Tiempo de Seguimiento)',
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
    }
];

export const DataExport = {
    async fetchAnalytics(session: Session): Promise<Record<string, number | string>> {
        try {
            const authQuery = session.apiKey
                ? `apiKey=${encodeURIComponent(session.apiKey)}`
                : session.token
                  ? `token=${encodeURIComponent(session.token)}`
                  : '';

            const headers: Record<string, string> = {};
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;

            const q = authQuery ? `?${authQuery}` : '';
            const response = await fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS}${q}`, {
                headers
            });

            if (response.ok) return await response.json();
        } catch (e) {
            console.error('[DataExport] Error fetching analytics:', e);
        }
        return {};
    },

    async fetchUserInfo(session: Session): Promise<Record<string, unknown>> {
        try {
            const authQuery = session.apiKey
                ? `apiKey=${encodeURIComponent(session.apiKey)}`
                : session.token
                  ? `token=${encodeURIComponent(session.token)}`
                  : '';

            const headers: Record<string, string> = {};
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;

            const q = `?login=${encodeURIComponent(session.login)}&${authQuery}`;
            const response = await fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}${q}`, {
                headers
            });

            if (response.ok) return await response.json();
        } catch (e) {
            console.error('[DataExport] Error fetching user info:', e);
        }
        return {
            followers: '---',
            broadcaster_type: '---',
            created_at: '---',
            description: '---',
            rateLimit: 120
        };
    },

    maskKey(key: string): string {
        if (key.length > 8) return key.slice(0, 4) + '••••••••' + key.slice(-4);
        return '••••••••';
    },

    getApiBaseUrl(): string {
        const { protocol, host } = window.location;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return `https://api.losperris.com/api/twitch`;
        }
        return `${protocol}//${host}/api/twitch`;
    },

    buildCommandRows(analytics: Record<string, number | string>, authKey: string): string {
        const rows: string[] = [];
        const baseUrl = this.getApiBaseUrl();

        for (const cmd of COMMAND_INTEGRATIONS) {
            const usageCount = analytics[cmd.id] || 0;
            const displayValue =
                typeof usageCount === 'number' ? usageCount.toLocaleString() : usageCount;

            const endpointMap: Record<string, string> = {
                clips: '/dashboard/get-clips',
                followage: '/followage',
                so: '/shoutout',
                magic8: '/minigames/magic8',
                russian: '/minigames/russian',
                duel: '/minigames/duel',
                roulette: '/minigames/roulette'
            };

            const endpoint = endpointMap[cmd.id] || `/${cmd.id}`;

            let variantsHtml = '';
            for (const v of cmd.variants) {
                const fullUrl = `${baseUrl}${endpoint}?${v.params}&apiKey=${authKey}`;
                variantsHtml += `
                    <div class="variant-box">
                        <div class="v-header">
                            <span class="v-name">${v.name}</span>
                            <span class="v-desc">${v.desc}</span>
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

            rows.push(`
                <div class="command-card">
                    <div class="cmd-header">
                        <div class="cmd-title">
                            <h3>${cmd.label}</h3>
                            <p>${cmd.description}</p>
                        </div>
                        <div class="cmd-stat">
                            <span class="s-val">${displayValue}</span>
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
    async export(session: Session): Promise<void> {
        const s = session;
        const userName = s.displayName || s.login || 'Usuario';
        const now = new Date();
        const exportDate = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const exportTime = now.toLocaleTimeString('es-ES');

        const userInfo = await this.fetchUserInfo(session);
        const analytics = await this.fetchAnalytics(session);

        const authKey = s.apiKey || s.token || '';
        const maskedKey = this.maskKey(authKey);

        const todayReqs = analytics.todayRequests ?? 0;
        const totalReqs = analytics.totalRequests ?? 0;
        const avgLatency = analytics.averageLatency ?? '0ms';
        const successRate = analytics.successRate ?? '100%';

        const bType =
            userInfo.broadcaster_type === 'partner'
                ? 'Partner'
                : userInfo.broadcaster_type === 'affiliate'
                  ? 'Afiliado'
                  : 'Estándar';
        const fCount =
            typeof userInfo.followers === 'number'
                ? userInfo.followers.toLocaleString()
                : userInfo.followers;
        const cDateObj = new Date((userInfo.created_at as string | number) || now);
        const memberSince = isNaN(cDateObj.getTime())
            ? '---'
            : cDateObj.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
              });

        const commandBoxes = this.buildCommandRows(analytics, authKey);

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mis Datos — LosPerris API</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0e0e12;color:#e0e0e8;min-height:100vh;padding:2rem}
.container{max-width:720px;margin:0 auto}
.header{text-align:center;margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid #2a2a35}
.header h1{font-size:1.8rem;font-weight:700;background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.3rem}
.header p{color:#9090a0;font-size:.85rem}
.avatar{width:80px;height:80px;border-radius:50%;border:3px solid #7c3aed;margin:0 auto 1rem;display:block;object-fit:cover}
.section{background:#16161d;border:1px solid #2a2a35;border-radius:12px;padding:1.5rem;margin-bottom:1.2rem}
.section-title{font-size:.75rem;text-transform:uppercase;letter-spacing:1.5px;color:#7c3aed;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.section-title::before{content:'';width:3px;height:14px;background:#7c3aed;border-radius:2px}
.row{display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid #1e1e28}
.row:last-child{border-bottom:none}
.row .label{color:#9090a0;font-size:.85rem;font-weight:500}
.row .value{color:#e0e0e8;font-size:.85rem;font-weight:600;text-align:right;max-width:60%;word-break:break-all}
.footer{text-align:center;margin-top:2rem;padding-top:1.2rem;border-top:1px solid #2a2a35;color:#5a5a6a;font-size:.75rem}
.badge{display:inline-block;background:#7c3aed22;color:#a78bfa;padding:.2rem .6rem;border-radius:6px;font-size:.75rem;font-weight:600}
.masked{font-family:monospace;letter-spacing:1px;color:#9090a0}

/* Command Cards Styles */
.commands-container { display: flex; flex-direction: column; gap: 1.2rem; }
.command-card { background: #1a1a24; border: 1px solid #2a2a35; border-radius: 10px; overflow: hidden; }
.cmd-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; border-bottom: 1px solid #2a2a35; background: #1c1c28;}
.cmd-title h3 { font-size: 1.1rem; color: #fff; margin-bottom: 0.2rem; font-weight: 600; }
.cmd-title p { font-size: 0.8rem; color: #9090a0; }
.cmd-stat { display: flex; flex-direction: column; align-items: flex-end; }
.cmd-stat .s-val { font-size: 1.4rem; font-weight: 700; color: #a78bfa; line-height: 1; }
.cmd-stat .s-lbl { font-size: 0.65rem; color: #7a7a8a; letter-spacing: 1px; margin-top: 0.2rem; }
.cmd-variants { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.variant-box { background: #15151e; border: 1px solid #252530; border-radius: 8px; padding: 0.8rem; }
.v-header { margin-bottom: 0.6rem; display: flex; flex-direction: column; }
.v-name { font-size: 0.85rem; font-weight: 600; color: #e0e0e8; }
.v-desc { font-size: 0.75rem; color: #7a7a8a; margin-top: 0.2rem; }
.bot-syntax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 0.8rem; }
.bot-syntax { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
.bot-name { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 2px; }
.bot-name img { width: 14px; height: 14px; object-fit: contain; border-radius: 3px; }
.code-block { background: #0a0a0f; color: #a78bfa; font-family: monospace; font-size: 0.8rem; padding: 0.8rem; border-radius: 6px; border: 1px solid #2a2a35; word-wrap: break-word; overflow-x: auto; white-space: pre-wrap; user-select: all; height: 100%; box-sizing: border-box; }
@media(max-width: 600px) { .bot-syntax-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        ${s.profile_image_url ? '<img src="' + s.profile_image_url + '" alt="Avatar" class="avatar">' : ''}
        <h1>${userName}</h1>
        <p>Reporte de datos personales — LosPerris API</p>
    </div>

    <div class="section">
        <div class="section-title">Información de Perfil</div>
        <div class="row"><span class="label">Nombre</span><span class="value">${userName}</span></div>
        <div class="row"><span class="label">Login</span><span class="value">@${s.login || '---'}</span></div>
        <div class="row"><span class="label">ID de Usuario</span><span class="value">${s.userId || '---'}</span></div>
        <div class="row"><span class="label">Tipo de Canal</span><span class="value"><span class="badge">${bType}</span></span></div>
        <div class="row"><span class="label">Seguidores</span><span class="value">${fCount}</span></div>
        <div class="row"><span class="label">Miembro Desde</span><span class="value">${memberSince}</span></div>
        <div class="row"><span class="label">Biografía</span><span class="value">${userInfo.description || '---'}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Seguridad y Acceso</div>
        <div class="row"><span class="label">API Key</span><span class="value masked">${maskedKey}</span></div>
        <div class="row"><span class="label">Estado</span><span class="value"><span class="badge">Activa</span></span></div>
        <div class="row"><span class="label">Límite de Peticiones</span><span class="value">${userInfo.rateLimit || 120}</span></div>
        <div class="row"><span class="label">Nivel de Acceso</span><span class="value">Full API</span></div>
    </div>

    <div class="section">
        <div class="section-title">Métricas Generales</div>
        <div class="row"><span class="label">Peticiones Hoy</span><span class="value">${todayReqs}</span></div>
        <div class="row"><span class="label">Peticiones Totales</span><span class="value">${totalReqs}</span></div>
        <div class="row"><span class="label">Latencia Promedio</span><span class="value">${avgLatency}</span></div>
        <div class="row"><span class="label">Tasa de Éxito</span><span class="value">${successRate}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Integraciones de Comandos</div>
        <div class="commands-container">
            ${commandBoxes || '<p style="text-align:center;color:#7a7a8a;margin-top:1rem">Aún no hay comandos registrados.</p>'}
        </div>
    </div>

    <div class="footer">
        <p>Exportado el ${exportDate} a las ${exportTime}</p>
        <p style="margin-top:.3rem">LosPerris API — Reporte generado automáticamente</p>
    </div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MisDatos_LosPerrisAPI_${s.login || 'usuario'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        UI.showToast('Archivo descargado correctamente', 'success');
    }
};
