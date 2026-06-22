import { logger } from '../utils/logger';

export const validateConfig = () => {
    // Las variables críticas (TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET) se validan en
    // tiempo de import dentro de env.ts; si faltan, el proceso ni siquiera arranca.
    // Aquí solo dejamos constancia de que la configuración quedó cargada.
    logger.info('✅ Configuración validada correctamente.');
};
