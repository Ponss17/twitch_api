import type { Session } from '@/core/config/config';

export function buildAuthQueryParam(session: Pick<Session, 'apiKey' | 'token'>): string {
    const { apiKey, token } = session;
    if (apiKey) return `apiKey=${encodeURIComponent(apiKey)}`;
    if (token) return `token=${encodeURIComponent(token)}`;
    return '';
}
