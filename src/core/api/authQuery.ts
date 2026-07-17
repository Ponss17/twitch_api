import type { Session } from '@/core/config/config';

export const API_KEY_PLACEHOLDER = 'sk_••••••••••••••••';

/** Máscara ASCII para comandos en el dashboard (no codificar: evita %E2%80%A2… en la UI). */
export const AUTH_QUERY_DISPLAY_MASK = '**************';

export function buildAuthQueryParam(session: Pick<Session, 'apiKey' | 'token'>): string {
    const { apiKey, token } = session;
    if (apiKey) return `apiKey=${encodeURIComponent(apiKey)}`;
    if (token) return `token=${encodeURIComponent(token)}`;
    return '';
}

/** Para vistas previas de comandos sin revelar la key real. */
export function buildAuthQueryParamForDisplay(_session?: Pick<Session, 'apiKey' | 'token'>): string {
    return `apiKey=${AUTH_QUERY_DISPLAY_MASK}`;
}
