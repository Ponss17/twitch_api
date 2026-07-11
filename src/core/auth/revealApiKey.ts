import { API_ENDPOINTS } from '@/core/config/config';
import { withApiCredentials } from './apiCredentials';

export type RevealApiKeyResult = {
    apiKey: string;
    masked: string;
};

export async function fetchRevealApiKey(): Promise<RevealApiKeyResult> {
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

    return (await response.json()) as RevealApiKeyResult;
}
