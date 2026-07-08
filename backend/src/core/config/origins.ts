import { CONFIG } from './env';

const LOCAL_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:4321',
    'http://localhost:5173',
    'http://127.0.0.1:4321',
    'http://127.0.0.1:3000'
];

const buildAllowedOrigins = (): string[] => {
    const origins = [
        'https://ttv.losperris.dev',
        'https://www.losperris.dev',
        'https://losperris.dev',
        ...LOCAL_ORIGINS
    ];

    try {
        const { origin } = new URL(CONFIG.BASE_URL);
        if (!origins.includes(origin)) {
            origins.push(origin);
        }
    } catch (_e) {
        // BASE_URL no configurada, usar solo los estáticos
    }

    return origins;
};

export const ALLOWED_ORIGINS = buildAllowedOrigins();

/** Origin/Referer del panel web (no bots ni OBS sin navegador). */
export function isPanelBrowserRequest(originHeader = '', refererHeader = ''): boolean {
    const origin = originHeader.trim();
    const referer = refererHeader.trim();

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return true;
    }

    if (!referer) return false;

    try {
        return ALLOWED_ORIGINS.includes(new URL(referer).origin);
    } catch {
        return false;
    }
}
