import { COMMAND_INTEGRATIONS, type AnalyticsData } from './exporterData';
import { getApiBaseUrl } from './exporterUtils';

const CMD_PATHS: Record<string, string> = {
    clips: '/dashboard/get-clips',
    followage: '/followage',
    watchtime: '/watchtime',
    so: '/shoutout',
    magic8: '/minigames/magic8',
    russian: '/minigames/russian',
    duel: '/minigames/duel',
    slots: '/minigames/slots',
};

export function buildCommandRows(analytics: AnalyticsData, apiKey: string): string {
    const apiBaseUrl = getApiBaseUrl();
    const publicCmds = COMMAND_INTEGRATIONS.filter(c => !(c as Record<string, unknown>).dashboard);
    const dashboardCmds = COMMAND_INTEGRATIONS.filter(c => !!(c as Record<string, unknown>).dashboard);

    const getCount = (id: string): number =>
        ((analytics[id] as number) || (analytics[`${id}_count`] as number) || 0);

    const publicRows = publicCmds.map(cmd => {
        const count = getCount(cmd.id);
        const countStr = count.toLocaleString();
        const method = (cmd as Record<string, unknown>).method === 'POST' ? 'POST' : 'GET';
        const path = CMD_PATHS[cmd.id] ?? `/${cmd.id}`;

        const tag = method === 'POST'
            ? '<span class="tag-post">POST</span>'
            : '';

        let variantsHtml = '';
        for (const variant of cmd.variants) {
            const fullUrl = `${apiBaseUrl}${path}${variant.params ? `?${variant.params}&apiKey=${apiKey}` : `?apiKey=${apiKey}`}`;
            const variantBody = (variant as Record<string, string>).body || '';

            if (method === 'POST') {
                variantsHtml += `
<div class="variant-block">
    <div class="variant-name">${variant.name}</div>
    <div class="code-block"><span class="code-comment">// cURL</span>
curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${variantBody}'

<span class="code-comment">// Fetch (JS)</span>
fetch("${fullUrl}", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify(${variantBody})
})</div>
</div>`;
            } else {
                variantsHtml += `
<div class="variant-block">
    <div class="variant-name">${variant.name}</div>
    <div class="code-block"><span class="code-comment">// Nightbot</span>
$(urlfetch ${fullUrl})

<span class="code-comment">// StreamElements</span>
\${customapi.${fullUrl}}</div>
</div>`;
            }
        }

        return `
<div class="cmd-item">
    <div class="cmd-header">
        <div class="cmd-header-left">
            <div class="cmd-name">${cmd.label}${tag}</div>
            <div class="cmd-desc">${cmd.description}</div>
        </div>
        <span class="cmd-count">${countStr} usos</span>
    </div>
    <div class="cmd-variants">${variantsHtml}</div>
</div>`;
    });

    const dashboardRows = dashboardCmds.map(cmd => {
        const count = getCount(cmd.id);
        const countStr = count.toLocaleString();
        return `
<div class="dash-tool-row">
    <div>
        <div class="dash-tool-name">${cmd.label}</div>
        <div class="dash-tool-desc">${cmd.description}</div>
    </div>
    <span class="dash-tool-count">${countStr} usos</span>
</div>`;
    });

    const dashboardBlock = dashboardCmds.length > 0 ? `
<div class="dash-tools">
    <div class="dash-tools-title">Herramientas del Dashboard</div>
    ${dashboardRows.join('')}
</div>` : '';

    return publicRows.join('') + dashboardBlock;
}