/**
 * Claves Redis / paths de overlay — viven en `core` para que auth y middleware
 * no dependan de `features/dashboard`.
 */

export const OVERLAY_TOOLS = ['roulette', 'trends', 'questions', 'bits-roulette'] as const;
export type OverlayToolName = (typeof OVERLAY_TOOLS)[number];

export const overlayStateKey = (userId: string, tool: string): string =>
    `overlay:state:${userId}:${tool}`;

export const overlayRevokeKey = (userId: string): string => `cache:overlay:revoke:${userId}`;

export const overlayPagePath = (tool: OverlayToolName): string => `/overlay/${tool}/`;

/** Payload firmado en tokens de lectura de overlay (OBS / browser source). */
export interface OverlayReadPayload {
    userId: string;
    tool: OverlayToolName;
    login: string;
    displayName: string;
    profile_image_url?: string;
    /** Tope de premios de Ruleta Bits según el plan. Solo en tokens de ese overlay. */
    maxPrizes?: number;
    /** Epoch ms — emisión del token (revocación por invalidación de caché). */
    iat?: number;
}
