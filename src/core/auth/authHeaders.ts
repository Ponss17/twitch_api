import type { Session } from '@/core/config/config';

export interface AuthHeaderOptions {
    /** Solo overlay OBS: usar x-api-key como los comandos de bot. */
    preferApiKey?: boolean;
}

/**
 * Headers de autenticación del panel.
 * Tras Opción 2 el panel autentica con cookie `lp_sess` (credentials:include);
 * no envía Bearer/apiKey. Overlay/bots pueden seguir usando preferApiKey si tienen key en memoria.
 */
export function authHeaders(
    session: Session | null,
    options: AuthHeaderOptions = {}
): Record<string, string> {
    const headers: Record<string, string> = {};
    const { preferApiKey = false } = options;

    if (preferApiKey && session?.apiKey) {
        headers['x-api-key'] = session.apiKey;
        return headers;
    }

    // Panel: cookie-only. No reintroducir token/apiKey en headers.
    return headers;
}
