import { API_ENDPOINTS } from '@/core/config/config';
import { withApiCredentials } from './apiCredentials';

export type RevealApiKeyResult = {
    apiKey: string;
    masked: string;
};

let memoryCache: RevealApiKeyResult | null = null;
let visibilityListenerAttached = false;

/** Borra la key revelada en RAM (logout, pestaña oculta, salir de Configuración). */
export function clearRevealedApiKeyCache(): void {
    memoryCache = null;
}

/** Guarda en RAM tras regenerate (sin volver a pedir reveal). */
export function cacheRevealedApiKey(result: RevealApiKeyResult): void {
    attachVisibilityClearOnce();
    memoryCache = result;
}

function attachVisibilityClearOnce(): void {
    if (visibilityListenerAttached || typeof document === 'undefined') return;
    visibilityListenerAttached = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearRevealedApiKeyCache();
        }
    });
}

export async function fetchRevealApiKey(): Promise<RevealApiKeyResult> {
    attachVisibilityClearOnce();

    if (memoryCache) {
        return memoryCache;
    }

    const response = await fetch(
        API_ENDPOINTS.REVEAL_API_KEY,
        withApiCredentials({
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
    );

    if (!response.ok) {
        let message = 'No se pudo obtener la API Key';
        try {
            const data = (await response.json()) as { message?: string; error?: string };
            message = data.message || data.error || message;
        } catch {
            /* respuesta no JSON */
        }
        throw new Error(message);
    }

    const result = (await response.json()) as RevealApiKeyResult;
    memoryCache = result;
    return result;
}
