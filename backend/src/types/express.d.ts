import type { StoredUser } from './twitch';

declare global {
    namespace Express {
        interface Request {
            twitchToken?: string;
            userId?: string;
            login?: string;
            displayName?: string;
        }

        interface Locals {
            apiUser?: StoredUser;
            isApiKeyRequest?: boolean;
            isOverlayReadRequest?: boolean;
            overlayTool?: 'roulette' | 'trends';
            customRateLimit?: number;
            cspNonce?: string;
        }
    }
}

export {};
