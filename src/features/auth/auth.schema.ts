import { z } from 'zod';

export const loginSchema = z.object({
    query: z.object({
        redirect_origin: z.string().optional(),
        admin: z.enum(['true', 'false']).optional()
    })
});

export const callbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'El código es obligatorio'),
        state: z.string().optional()
    })
});
