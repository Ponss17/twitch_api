import type { Session } from '@/core/config/config';
import { parseHttpErrorBody } from '@/core/api/apiError';
import { authHeaders } from './authHeaders';
import { withApiCredentials } from './apiCredentials';
import { invalidateSession } from './sessionLifecycle';
import { getSession } from './sessionStorage';
import { isWithinSessionAuthGrace, clearSessionAuthGrace } from './sessionAuthGrace';
import { clearValidateCache } from './validateCache';

export type ApiFetchOptions = {
    /**
     * Si false, un 401 tras reintentos lanza error sin cerrar sesión.
     * Útil en cargas parciales del panel.
     */
    logoutOn401?: boolean;
};

const GRACE_401_RETRY_MS = [600, 1200, 2000];
const DEFAULT_401_RETRY_MS = [3000];

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function apiFetch<T>(
    url: string,
    session: Session | null,
    init: RequestInit = {},
    options: ApiFetchOptions = {}
): Promise<T> {
    const fetchWithHeaders = (sess: Session | null) =>
        fetch(
            url,
            withApiCredentials({
                ...init,
                headers: {
                    ...authHeaders(sess),
                    ...(init.headers as Record<string, string> | undefined)
                }
            })
        );

    const response = await fetchWithHeaders(session);

    const isRetriableStatus = (status: number) => status === 401 || status === 503;

    if (!response.ok) {
        if (isRetriableStatus(response.status) && typeof window !== 'undefined') {
            const inGrace = isWithinSessionAuthGrace();
            const retryDelays = inGrace ? GRACE_401_RETRY_MS : DEFAULT_401_RETRY_MS;
            let lastResponse = response;

            for (const delayMs of retryDelays) {
                await sleep(delayMs);
                lastResponse = await fetchWithHeaders(getSession());
                if (lastResponse.ok) {
                    return (await lastResponse.json()) as T;
                }
                if (!isRetriableStatus(lastResponse.status)) {
                    break;
                }
            }

            const shouldLogout =
                lastResponse.status === 401 && options.logoutOn401 !== false && !inGrace;
            if (lastResponse.status === 401 && !inGrace) {
                clearValidateCache(getSession());
                clearSessionAuthGrace();
                window.dispatchEvent(new CustomEvent('session:auth-failed'));
            }
            if (shouldLogout) {
                invalidateSession({ broadcast: true });
                window.location.href = window.location.origin + window.location.pathname;
                await new Promise(() => {});
            }

            const retryText = await lastResponse.text();
            throw new Error(parseHttpErrorBody(retryText, `HTTP ${lastResponse.status}`));
        }

        const text = await response.text();
        throw new Error(parseHttpErrorBody(text, `HTTP ${response.status}`));
    }

    return (await response.json()) as T;
}
