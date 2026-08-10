import { COMMAND_INTEGRATIONS, type AnalyticsData } from './exporterData';
import { getApiBaseUrl } from './exporterUtils';

const CMD_PATHS: Record<string, string> = {
    clips: '/dashboard/get-clips',
    followage: '/followage',
    watchtime: '/watchtime',
    message: '/send-message',
    so: '/shoutout',
    magic8: '/minigames/magic8',
    russian: '/minigames/russian',
    duel: '/minigames/duel',
    slots: '/minigames/slots',
    roulette: '',
    stalker: '',
    trends: ''
};

/** Genera el bloque HTML de todos los comandos/integraciones para el reporte exportado. */
export function buildCommandRows(analytics: AnalyticsData, apiKey: string): string {
    const rows: string[] = [];
    const apiBaseUrl = getApiBaseUrl();

    for (const cmd of COMMAND_INTEGRATIONS) {
        const count = analytics[cmd.id] || 0;
        const countStr = typeof count === 'number' ? count.toLocaleString() : count;
        const method = (cmd as Record<string, unknown>).method === 'POST' ? 'POST' : 'GET';
        const isDashboard = !!(cmd as Record<string, unknown>).dashboard;
        const path = CMD_PATHS[cmd.id] ?? `/${cmd.id}`;
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
                        <div class="dashboard-only-badge"><span>Solo disponible en el Dashboard</span></div>
                    </div>`;
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
                    </div>`;
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
                    </div>`;
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
                <div class="cmd-variants">${variantsHtml}</div>
            </div>`);
    }

    return rows.join('');
}