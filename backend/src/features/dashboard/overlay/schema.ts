import { z } from 'zod';
import { OVERLAY_TOOLS } from '../../../core/overlay/keys';

const MAX_OVERLAY_STATE_BYTES = 64 * 1024;
const MAX_OVERLAY_KEYS = 200;
const overlayToolEnum = z.enum(OVERLAY_TOOLS);

export const overlayToolParamSchema = z.object({
    params: z.object({
        tool: overlayToolEnum
    })
});

export const putOverlayStateSchema = z.object({
    params: z.object({
        tool: overlayToolEnum
    }),
    body: z.object({
        state: z
            .record(z.string(), z.unknown())
            .refine((state) => Object.keys(state).length <= MAX_OVERLAY_KEYS, {
                message: 'Demasiadas claves en el estado del overlay.'
            })
            .refine((state) => JSON.stringify(state).length <= MAX_OVERLAY_STATE_BYTES, {
                message: 'Estado del overlay demasiado grande.'
            })
    })
});

export const overlayLinkSchema = z.object({
    body: z.object({
        tool: overlayToolEnum
    })
});
