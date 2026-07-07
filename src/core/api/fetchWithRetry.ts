/**
 * Wrapper de fetch con reintento automático en cold start de Vercel (5xx).
 *
 * Vercel congela las funciones serverless tras ~5 min de inactividad.
 * El primer request puede fallar con un 500 mientras la función "despierta".
 * Este helper reintenta una vez tras 900 ms si recibe un 5xx.
 */
export async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    options?: {
        /** ms a esperar antes de reintentar. Default: 900 */
        retryDelayMs?: number;
        /** Número máximo de reintentos. Default: 1 */
        maxRetries?: number;
    }
): Promise<Response> {
    const retryDelayMs = options?.retryDelayMs ?? 900;
    const maxRetries = options?.maxRetries ?? 1;

    let response = await fetch(input, init);

    for (let attempt = 0; attempt < maxRetries && response.status >= 500; attempt++) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        response = await fetch(input, init);
    }

    return response;
}
