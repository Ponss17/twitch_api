import type { Session } from '@/core/config/config';

export const SESSION_KEY = 'twitch_api_session';

/** Campos seguros persistidos en localStorage (sin apiKey ni access token). */
function toPersistedSession(session: Session): Session {
    return {
        userId: session.userId,
        login: session.login || '',
        displayName: session.displayName || '',
        profile_image_url: session.profile_image_url || '',
        tokenExpiresAt: session.tokenExpiresAt,
        isNewLogin: session.isNewLogin
    };
}

export function getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Session;
        // Migración: no rehidratar secretos aunque queden en LS antiguo.
        return toPersistedSession(parsed);
    } catch {
        return null;
    }
}

export function saveSession(session: Session): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(toPersistedSession(session)));
}

export function removeSessionStorage(): void {
    localStorage.removeItem(SESSION_KEY);
}
