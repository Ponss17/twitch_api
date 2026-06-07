import { CONFIG } from '../config/env';
import { logger } from '../utils/logger';

export const validateConfig = () => {
    const isProd = CONFIG.NODE_ENV === 'production';
    const missing: string[] = [];

    // NOTE: TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are validated at import time in env.ts
    // Here we only check production-specific variables
    if (isProd) {
        // Admin check eliminado
    }

    if (missing.length > 0) {
        const errorMsg = `❌ ERROR DE CONFIGURACIÓN: Faltan variables críticas: ${missing.join(', ')}`;
        logger.error(errorMsg);
        if (isProd) {
            throw new Error(errorMsg);
        }
    } else {
        logger.info('✅ Configuración validada correctamente.');
    }
};
