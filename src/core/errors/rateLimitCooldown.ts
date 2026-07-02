export const RATE_LIMIT_COOLDOWN_KEY = 'rate_limit_cooldown';

export function rateLimitWindowEnd(windowMs: number, now = Date.now()): number {
    return Math.floor(now / windowMs) * windowMs + windowMs;
}

/** Lee cooldown activo desde ?until= o localStorage; no inventa uno nuevo. */
export function resolveRateLimitCooldownEnd(): number | null {
    if (typeof window === 'undefined') return null;

    const now = Date.now();
    const params = new URLSearchParams(window.location.search);
    const untilParam = params.get('until');

    if (untilParam) {
        const until = parseInt(untilParam, 10);
        if (!Number.isNaN(until) && until > now) {
            try {
                localStorage.setItem(RATE_LIMIT_COOLDOWN_KEY, String(until));
            } catch {
                /* quota exceeded */
            }

            params.delete('until');
            const qs = params.toString();
            const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
            window.history.replaceState({}, '', clean);
            return until;
        }
    }

    try {
        const stored = localStorage.getItem(RATE_LIMIT_COOLDOWN_KEY);
        if (!stored) return null;

        const end = parseInt(stored, 10);
        if (!Number.isNaN(end) && end > now) return end;

        localStorage.removeItem(RATE_LIMIT_COOLDOWN_KEY);
    } catch {
        /* ignore */
    }

    return null;
}

export function clearRateLimitCooldown(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(RATE_LIMIT_COOLDOWN_KEY);
    } catch {
        /* ignore */
    }
}
