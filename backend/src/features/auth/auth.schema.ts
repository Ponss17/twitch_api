import { z } from 'zod';
import { ALLOWED_ORIGINS } from '../../core/config/origins';

const optionalOrigin = z
    .string()
    .url()
    .refine(
        (value) => {
            try {
                return ALLOWED_ORIGINS.includes(new URL(value).origin);
            } catch {
                return false;
            }
        },
        { message: 'redirect_origin no permitido' }
    )
    .optional();

export const loginSchema = z.object({
    query: z.object({
        redirect_origin: optionalOrigin
    }),
    body: z.object({}).optional(),
    params: z.object({}).optional()
});

export const callbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'El código es obligatorio'),
        state: z.string().optional()
    })
});

export const exchangeSchema = z.object({
    query: z.object({
        auth: z.string().min(20).max(4096).optional()
    })
});

export const overlayExchangeSchema = z.object({
    query: z.object({
        overlayToken: z.string().min(20).max(4096).optional()
    })
});
