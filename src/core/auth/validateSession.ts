import { API_ENDPOINTS, type ApiResponse, type Session } from '@/core/config/config';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { sessionFingerprint } from '@/core/session/localPrefs';
import { authHeaders } from './authHeaders';
import { withApiCredentials } from './apiCredentials';
import { getSession, saveSession } from './sessionStorage';
import { mergeSessionFieldsFromValidate } from './sessionMerge';
import {
    clearValidateCache,
    readFreshValidateCache,
    writeValidateCache
} from './validateCache';
import { markSessionValidated } from './sessionAuthGrace';

function canUseDegradedSession(session: Session): boolean {
    if (session.apiKey || session.token || session.overlayToken) return true;
    const stored = getSession();
    return !!(stored?.apiKey || stored?.token || stored?.overlayToken);
}

function validateDedupeKey(session: Session): string {
    if (session.overlayToken) return `overlay:${session.overlayToken}`;
    return sessionFingerprint(session);
}

let validateInFlight: Promise<ApiResponse> | null = null;
let validateInFlightKey: string | null = null;

export async function validateSession(session: Session): Promise<ApiResponse> {
    const dedupeKey = validateDedupeKey(session);
    if (validateInFlight && validateInFlightKey === dedupeKey) {
        return validateInFlight;
    }

    const run = runValidateSession(session);
    validateInFlight = run;
    validateInFlightKey = dedupeKey;
    try {
        return await run;
    } finally {
        if (validateInFlight === run) {
            validateInFlight = null;
            validateInFlightKey = null;
        }
    }
}

async function runValidateSession(session: Session): Promise<ApiResponse> {
    if (session.overlayToken) {
        return validateOverlaySession(session);
    }

    if (!session.apiKey && !session.token) {
        return { valid: false, error: true, message: 'no_credentials' };
    }

    const cached = readFreshValidateCache(session);
    if (cached) {
        reportSessionLoadProgress({
            progress: 48,
            label: 'Sesión validada (caché local)',
            cached: true
        });
        if (cached.valid === true) {
            markSessionValidated();
        }
        return cached;
    }

    reportSessionLoadProgress({
        progress: 28,
        label: 'Validando con Twitch…',
        cached: false
    });

    let driftProgress = 28;
    const driftTimer =
        typeof window !== 'undefined'
            ? window.setInterval(() => {
                  driftProgress = Math.min(driftProgress + 1, 46);
                  reportSessionLoadProgress({
                      progress: driftProgress,
                      label: 'Despertando servidor (sin caché)…',
                      cached: false
                  });
              }, 450)
            : null;

    const attempt = async (credentials: Session) => {
        try {
            const response = await fetch(
                API_ENDPOINTS.VALIDATE,
                withApiCredentials({
                    headers: authHeaders(credentials)
                })
            );

            if (!response.ok) {
                if (response.status === 401) {
                    return { valid: false, error: true, message: 'unauthorized' as const, networkError: false };
                }
                return {
                    valid: false,
                    error: true,
                    message: `HTTP ${response.status}`,
                    networkError: true
                };
            }

            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = (await response.json()) as ApiResponse;
                return data.valid
                    ? { ...data, networkError: false }
                    : { valid: false, error: true, networkError: false };
            }

            return { valid: true, networkError: false };
        } catch {
            return { valid: false, error: true, message: 'network_error', networkError: true };
        }
    };

    try {
        let result: ApiResponse & { networkError?: boolean };

        if (session.apiKey) {
            result = await attempt({
                apiKey: session.apiKey,
                login: session.login,
                userId: session.userId
            });
            if (result.valid !== true && !result.networkError && session.token) {
                result = await attempt(session);
            }
        } else {
            result = await attempt(session);
        }

        reportSessionLoadProgress({
            progress: 52,
            label: result.valid === true ? 'Sesión verificada' : 'Comprobando credenciales…',
            cached: false
        });

        if (result.valid === true) {
            saveSession(mergeSessionFieldsFromValidate(session, result));
            markSessionValidated();
        }

        if (result.valid !== true && result.networkError) {
            if (canUseDegradedSession(session)) {
                return {
                    valid: true,
                    error: true,
                    message: result.message,
                    networkError: true
                };
            }
            return { valid: false, error: true, message: result.message ?? 'network_error' };
        }

        if (result.valid === true && !result.error) {
            writeValidateCache(session, result);
        } else if (!result.networkError) {
            clearValidateCache(session);
        }

        return result;
    } finally {
        if (driftTimer) window.clearInterval(driftTimer);
    }
}

async function validateOverlaySession(session: Session): Promise<ApiResponse> {
    if (!session.overlayToken) {
        return { valid: false, error: true, message: 'no_credentials' };
    }

    try {
        const response = await fetch(
            `${API_ENDPOINTS.OVERLAY_EXCHANGE}?overlayToken=${encodeURIComponent(session.overlayToken)}`
        );

        if (!response.ok) {
            return {
                valid: false,
                error: true,
                message: response.status === 401 ? 'unauthorized' : `HTTP ${response.status}`
            };
        }

        const data = (await response.json()) as ApiResponse;
        return { valid: true, ...data };
    } catch {
        return { valid: false, error: true, message: 'network_error', networkError: true };
    }
}
