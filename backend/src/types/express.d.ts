import type { StoredUser } from './twitch';

declare global {
    namespace Express {
        interface Request {
            twitchToken?: string;
            userId?: string;
            login?: string;
            displayName?: string;
            /** Timezone IANA del usuario autenticado (ej. 'America/Costa_Rica').
             *  Siempre disponible tras pasar por authMiddleware. Evita fallback a UTC en cold starts. */
            userTimezone?: string;
        }

        interface Locals {
            apiUser?: StoredUser;
            isApiKeyRequest?: boolean;
            isOverlayReadRequest?: boolean;
            overlayTool?: 'roulette' | 'trends';
            customRateLimit?: number;
            cspNonce?: string;
            requestId?: string;
        }
    }
}

export {};
