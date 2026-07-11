import type { Session } from '@/core/config/config';

export const SESSION_KEY = 'twitch_api_session';

function stripSensitiveFields(session: Session): Session {
    const { token: _token, apiKey: _apiKey, ...safe } = session;
    return safe;
}

export function getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Session;
        if (parsed.token || parsed.apiKey) {
            const safe = stripSensitiveFields(parsed);
            localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
            return safe;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSession(session: Session): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(stripSensitiveFields(session)));
}

export function removeSessionStorage(): void {
    localStorage.removeItem(SESSION_KEY);
}
