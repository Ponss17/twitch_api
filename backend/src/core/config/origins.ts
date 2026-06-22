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
        'https://www.losperris.dev',
        'https://losperris.dev',
        'https://twitch-api-modern.vercel.app',
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
