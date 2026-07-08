import type { ApiResponse, Session } from '@/core/config/config';
import { sessionFingerprint } from '@/core/session/localPrefs';
import { getSession } from './sessionStorage';

const VALIDATE_CACHE_BASE = 'twitch_validate_cache';
const LEGACY_VALIDATE_CACHE_KEY = 'twitch_validate_cache';
/** Caché de validate en localStorage; TTL dinámico según tokenExpiresAt o 1h sin OAuth. */
const VALIDATE_CACHE_MAX_TTL_MS = 60 * 60 * 1000;
/** Con OAuth: no reutilizar caché cerca del vencimiento (alineado con useProactiveTokenRefresh). */
const VALIDATE_CACHE_OAUTH_BUFFER_MS = 35 * 60 * 1000;

const VALIDATE_CACHE_SENSITIVE_KEYS = ['apiKey', 'overlayToken', 'token'] as const;

type ValidateCacheEntry = { at: number; result: ApiResponse };

function stripValidateCachePayload(result: ApiResponse): ApiResponse {
    const sanitized = { ...result };
    for (const key of VALIDATE_CACHE_SENSITIVE_KEYS) {
        delete sanitized[key];
    }
    return sanitized;
}

function validateCacheKey(session: Session): string {
    return `${VALIDATE_CACHE_BASE}_${sessionFingerprint(session)}`;
}

function resolveTokenExpiresAt(cached: ValidateCacheEntry, session: Session): number | null {
    const fromResult = cached.result.tokenExpiresAt;
    if (typeof fromResult === 'number' && fromResult > 0) return fromResult;

    if (typeof session.tokenExpiresAt === 'number' && session.tokenExpiresAt > 0) {
        return session.tokenExpiresAt;
    }

    const stored = getSession();
    if (typeof stored?.tokenExpiresAt === 'number' && stored.tokenExpiresAt > 0) {
        return stored.tokenExpiresAt;
    }

    return null;
}

function isValidateCacheFresh(cached: ValidateCacheEntry, session: Session): boolean {
    if (cached.result.valid !== true) return false;

    const now = Date.now();
    const tokenExpiresAt = resolveTokenExpiresAt(cached, session);

    if (tokenExpiresAt) {
        return now < tokenExpiresAt - VALIDATE_CACHE_OAUTH_BUFFER_MS;
    }

    return now - cached.at < VALIDATE_CACHE_MAX_TTL_MS;
}

/** Elimina el caché de validate para forzar una revalidación real contra el servidor.
 * Útil para el refresh proactivo de token: sin esto, validateSession devolvería el caché
 * y nunca llegaría al backend a renovar el token de Twitch. */
export function clearValidateCache(session?: Session | null): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LEGACY_VALIDATE_CACHE_KEY);
    if (session) {
        localStorage.removeItem(validateCacheKey(session));
    }
}

export function readFreshValidateCache(session: Session): ApiResponse | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(validateCacheKey(session));
        if (!raw) return null;

        const cached = JSON.parse(raw) as ValidateCacheEntry;
        if (!isValidateCacheFresh(cached, session)) {
            clearValidateCache(session);
            return null;
        }

        return stripValidateCachePayload(cached.result);
    } catch {
        clearValidateCache(session);
        return null;
    }
}

export function writeValidateCache(session: Session, result: ApiResponse): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(
            validateCacheKey(session),
            JSON.stringify({ at: Date.now(), result: stripValidateCachePayload(result) })
        );
        localStorage.removeItem(LEGACY_VALIDATE_CACHE_KEY);
    } catch {
        /* quota exceeded */
    }
}
