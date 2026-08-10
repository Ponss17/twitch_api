/**
 * Claves Redis / paths de overlay — viven en `core` para que auth y middleware
 * no dependan de `features/dashboard`.
 */

export const OVERLAY_TOOLS = ['roulette', 'trends'] as const;
export type OverlayToolName = (typeof OVERLAY_TOOLS)[number];

export const overlayStateKey = (userId: string, tool: string): string =>
    `overlay:state:${userId}:${tool}`;

export const overlayRevokeKey = (userId: string): string => `cache:overlay:revoke:${userId}`;

export const overlayPagePath = (tool: OverlayToolName): string =>
    tool === 'roulette' ? '/overlay/roulette' : '/overlay/trends';

/** Payload firmado en tokens de lectura de overlay (OBS / browser source). */
export interface OverlayReadPayload {
    userId: string;
    tool: OverlayToolName;
    login: string;
    displayName: string;
    profile_image_url?: string;
    /** Epoch ms — emisión del token (revocación por invalidación de caché). */
    iat?: number;
}
