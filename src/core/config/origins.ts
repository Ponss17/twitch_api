import { CONFIG } from './env';

const LOCAL_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

const buildAllowedOrigins = (): string[] => {
    const origins = ['https://www.losperris.dev', 'https://losperris.dev', ...LOCAL_ORIGINS];

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
