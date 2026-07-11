import type { Session } from '@/core/config/config';
import { parseHttpErrorBody } from '@/core/api/apiError';
import { authHeaders } from './authHeaders';
import { withApiCredentials } from './apiCredentials';
import { invalidateSession } from './sessionLifecycle';
import { getSession } from './sessionStorage';

export async function apiFetch<T>(
    url: string,
    session: Session | null,
    init: RequestInit = {}
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

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            // Esperar 3s y reintentar una vez antes de desloguear (cold starts / spikes de Vercel)
            await new Promise<void>((resolve) => window.setTimeout(resolve, 3000));
            const retryResponse = await fetchWithHeaders(getSession());
            if (retryResponse.ok) {
                return (await retryResponse.json()) as T;
            }

            if (retryResponse.status === 401) {
                // Ahora sí es un 401 confirmado — cerrar sesión
                invalidateSession({ broadcast: true });
                window.location.href = window.location.origin + window.location.pathname;
                await new Promise(() => {});
            }

            const retryText = await retryResponse.text();
            throw new Error(parseHttpErrorBody(retryText, `HTTP ${retryResponse.status}`));
        }

        const text = await response.text();
        throw new Error(parseHttpErrorBody(text, `HTTP ${response.status}`));
    }

    return (await response.json()) as T;
}
