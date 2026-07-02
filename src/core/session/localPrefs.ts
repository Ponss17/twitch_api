import type { Session } from '@/core/config/config';

/** Clave localStorage scoped por usuario de Twitch. */
export function userPrefKey(base: string, userId: string): string {
    return `${base}_${userId}`;
}

/** Identificador estable para cachear validación sin mezclar cuentas. */
export function sessionFingerprint(session: Pick<Session, 'userId' | 'apiKey' | 'token'>): string {
    if (session.userId) return session.userId;
    if (session.apiKey) return `ak_${session.apiKey}`;
    if (session.token) return `tk_${session.token.slice(-24)}`;
    return 'unknown';
}

export function readScopedPref(
    base: string,
    userId: string | undefined,
    legacyKey?: string
): string | null {
    if (typeof window === 'undefined') return null;

    try {
        if (userId) {
            const key = userPrefKey(base, userId);
            const scoped = localStorage.getItem(key);
            if (scoped !== null) return scoped;

            if (legacyKey) {
                const legacy = localStorage.getItem(legacyKey);
                if (legacy !== null) {
                    localStorage.setItem(key, legacy);
                    localStorage.removeItem(legacyKey);
                    return legacy;
                }
            }
            return null;
        }

        if (legacyKey) return localStorage.getItem(legacyKey);
        return null;
    } catch {
        return null;
    }
}

export function writeScopedPref(
    base: string,
    userId: string | undefined,
    value: string,
    legacyKey?: string
): void {
    if (typeof window === 'undefined') return;

    try {
        if (userId) {
            localStorage.setItem(userPrefKey(base, userId), value);
            return;
        }
        if (legacyKey) localStorage.setItem(legacyKey, value);
    } catch {
        /* quota exceeded */
    }
}

export function removeScopedPref(base: string, userId: string | undefined, legacyKey?: string): void {
    if (typeof window === 'undefined') return;

    try {
        if (userId) localStorage.removeItem(userPrefKey(base, userId));
        if (legacyKey) localStorage.removeItem(legacyKey);
    } catch {
        /* ignore */
    }
}
