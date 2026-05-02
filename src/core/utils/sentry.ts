import * as Sentry from '@sentry/node';
import { CONFIG } from '../config/env';

// Solo inicializar en producción y si el DSN está configurado
const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) {
        if (CONFIG.NODE_ENV === 'production') {
            console.warn('[Sentry] SENTRY_DSN no configurado, monitoreo desactivado.');
        }
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: CONFIG.NODE_ENV,
        tracesSampleRate: 0.2,
        profilesSampleRate: 0.1,
        beforeSend(event) {
            // No enviar errores de rate limiting (son esperados)
            if (event.exception?.values?.[0]?.value?.includes('429')) {
                return null;
            }
            return event;
        }
    });

    console.log('[Sentry] Monitoreo de errores inicializado.');
}

export { Sentry };
