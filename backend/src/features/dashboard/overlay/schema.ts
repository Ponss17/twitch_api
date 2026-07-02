import { z } from 'zod';

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
        state: z.record(z.string(), z.unknown())
    })
});

export const overlayLinkSchema = z.object({
    body: z.object({
        tool: z.enum(['roulette', 'trends'] as const)
    })
});
