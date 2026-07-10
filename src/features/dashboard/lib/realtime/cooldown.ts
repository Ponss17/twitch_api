const REALTIME_COOLDOWN_SESSION_KEY = 'realtime_cooldown_until';
const REALTIME_COOLDOWN_MS = 5 * 60 * 1000;

let realtimeCooldownUntil = 0;

if (typeof window !== 'undefined') {
    try {
        const stored = sessionStorage.getItem(REALTIME_COOLDOWN_SESSION_KEY);
        if (stored) {
            const until = parseInt(stored, 10);
            if (!Number.isNaN(until) && until > Date.now()) {
                realtimeCooldownUntil = until;
            } else {
                sessionStorage.removeItem(REALTIME_COOLDOWN_SESSION_KEY);
            }
        }
    } catch {
        /* ignore */
    }
}

export function isRealtimeInCooldown(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const stored = sessionStorage.getItem(REALTIME_COOLDOWN_SESSION_KEY);
            if (stored) {
                const until = parseInt(stored, 10);
                if (!Number.isNaN(until)) {
                    realtimeCooldownUntil = Math.max(realtimeCooldownUntil, until);
                }
            }
        } catch {
            /* ignore */
        }
    }
    return Date.now() < realtimeCooldownUntil;
}

export function markRealtimeCooldown(): void {
    realtimeCooldownUntil = Date.now() + REALTIME_COOLDOWN_MS;
    if (typeof window !== 'undefined') {
        try {
            sessionStorage.setItem(REALTIME_COOLDOWN_SESSION_KEY, String(realtimeCooldownUntil));
        } catch {
            /* ignore */
        }
    }
}
