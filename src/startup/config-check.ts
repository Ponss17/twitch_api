import { CONFIG } from '../config/env';
import { logger } from '../utils/logger';

export const validateConfig = () => {
    const isProd = CONFIG.NODE_ENV === 'production';
    const missing = [];

    if (!CONFIG.TWITCH_CLIENT_ID) missing.push('TWITCH_CLIENT_ID');
    if (!CONFIG.TWITCH_CLIENT_SECRET) missing.push('TWITCH_CLIENT_SECRET');

    if (isProd) {
        if (!CONFIG.ADMIN_ROOT_ID) missing.push('ADMIN_ROOT_ID');
        if (!CONFIG.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
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
