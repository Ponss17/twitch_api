import type { Session } from '@/core/config/config';

export const SESSION_KEY = 'twitch_api_session';

export function getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
}

export function saveSession(session: Session): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function removeSessionStorage(): void {
    localStorage.removeItem(SESSION_KEY);
}
