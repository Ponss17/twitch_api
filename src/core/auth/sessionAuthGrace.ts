/** Tras un validate exitoso, evitamos logout por 401 transitorios (cold start / carreras). */
const SESSION_AUTH_GRACE_MS = 2 * 60 * 1000;

let sessionValidatedAt: number | null = null;

export function markSessionValidated(): void {
    sessionValidatedAt = Date.now();
}

export function clearSessionAuthGrace(): void {
    sessionValidatedAt = null;
}

export function isWithinSessionAuthGrace(): boolean {
    if (sessionValidatedAt == null) return false;
    return Date.now() - sessionValidatedAt < SESSION_AUTH_GRACE_MS;
}

/** Solo tests */
export function __resetSessionAuthGraceForTests(): void {
    sessionValidatedAt = null;
}
