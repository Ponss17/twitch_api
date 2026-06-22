import { z } from 'zod';

export const loginSchema = z.object({
    query: z.object({
        redirect_origin: z.string().optional()
    }),
    body: z.any().optional(),
    params: z.any().optional()
});

export const callbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'El código es obligatorio'),
        state: z.string().optional()
    })
});
