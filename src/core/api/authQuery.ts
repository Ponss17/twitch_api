import type { Session } from '@/core/config/config';

export const API_KEY_PLACEHOLDER = 'sk_••••••••••••••••';

export function buildAuthQueryParam(session: Pick<Session, 'apiKey' | 'token'>): string {
    const { apiKey, token } = session;
    if (apiKey) return `apiKey=${encodeURIComponent(apiKey)}`;
    if (token) return `token=${encodeURIComponent(token)}`;
    return '';
}

/** Para vistas previas de comandos sin revelar la key real. */
export function buildAuthQueryParamForDisplay(session: Pick<Session, 'apiKey' | 'token'>): string {
    const param = buildAuthQueryParam(session);
    return param || `apiKey=${encodeURIComponent(API_KEY_PLACEHOLDER)}`;
}
