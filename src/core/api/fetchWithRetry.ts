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
        /** Permite reintentar una mutación que el caller sabe que es idempotente. */
        retryUnsafe?: boolean;
    }
): Promise<Response> {
    const retryDelayMs = options?.retryDelayMs ?? 900;
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    const isSafeMethod = ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);
    const canRetry =
        isSafeMethod || options?.retryUnsafe === true || headers.has('Idempotency-Key');
    const maxRetries = canRetry ? (options?.maxRetries ?? 1) : 0;

    let response = await fetch(input, init);

    for (let attempt = 0; attempt < maxRetries && response.status >= 500; attempt++) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        response = await fetch(input, init);
    }

    return response;
}
