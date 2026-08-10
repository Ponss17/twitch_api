import { z } from 'zod';

const MAX_OVERLAY_STATE_BYTES = 64 * 1024;
const MAX_OVERLAY_KEYS = 200;

export const overlayToolParamSchema = z.object({
    params: z.object({
        tool: z.enum(['roulette', 'trends'] as const)
    })
});

export const putOverlayStateSchema = z.object({
    params: z.object({
        tool: z.enum(['roulette', 'trends'] as const)
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
        tool: z.enum(['roulette', 'trends'] as const)
    })
});
