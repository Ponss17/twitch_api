import type { Session } from '@/core/config/config';
import { parseHttpErrorBody } from '@/core/api/apiError';
import { authHeaders } from './authHeaders';
import { invalidateSession } from './sessionLifecycle';
import { getSession } from './sessionStorage';
import { validateSession } from './validateSession';

export async function apiFetch<T>(
    url: string,
    session: Session | null,
    init: RequestInit = {}
): Promise<T> {
    const fetchWithHeaders = (sess: Session | null) =>
        fetch(url, {
            ...init,
            headers: {
                ...authHeaders(sess),
                ...(init.headers as Record<string, string> | undefined)
            }
        });

    let response = await fetchWithHeaders(session);

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            if (session?.apiKey) {
                // Intento 1: refrescar token via apiKey
                const refreshResult = await validateSession({ ...session, token: undefined });
                if (refreshResult.valid && refreshResult.token) {
                    const newSession = getSession();
                    response = await fetchWithHeaders(newSession);
                    if (response.ok) {
                        return (await response.json()) as T;
                    }
                }
            }

            // Si sigue siendo 401, esperar 3s y reintentar una vez antes de desloguear
            // Esto evita logouts por cold starts o spikes transitorios de Vercel
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
