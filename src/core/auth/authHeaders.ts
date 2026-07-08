import type { Session } from '@/core/config/config';

export interface AuthHeaderOptions {
    /** Solo overlay OBS: usar x-api-key como los comandos de bot. */
    preferApiKey?: boolean;
}

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

    // Panel OAuth: priorizar token de Twitch; la API key es para bots/scripts.
    if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
    } else if (session?.apiKey) {
        headers['x-api-key'] = session.apiKey;
    }
    return headers;
}
