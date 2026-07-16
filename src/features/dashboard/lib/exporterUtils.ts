/** Utilidades puras del exportador (sin dependencias de red ni DOM). */

export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'"'"'/g, '&#39;');
}

export function maskKey(key: string): string {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export function getApiBaseUrl(): string {
    const { protocol, host } = window.location;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return 'https://ttv.losperris.dev';
    }
    return `${protocol}//${host}/api/twitch`;
}

/** Origen absoluto para enlaces del reporte (funciona al abrir el .html fuera del sitio). */
export function getExportSiteOrigin(): string {
    const { host } = window.location;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return 'https://ttv.losperris.dev';
    }
    return window.location.origin;
}
