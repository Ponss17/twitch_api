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
        redirect_origin: optionalOrigin,
        tz: z.string().min(1).max(100).optional()
    }),
    body: z.object({}).optional(),
    params: z.object({}).optional()
});

export const callbackSchema = z.object({
    query: z.object({
        code: z.string().min(1, 'El código es obligatorio'),
        state: z.string().min(20).max(4096)
    })
});

const authExchangeToken = z.string().min(20).max(4096).optional();

export const exchangeSchema = z.object({
    query: z.object({
        auth: authExchangeToken
    }),
    /** POST: el token no viaja en la query (logs de acceso). GET sigue aceptando ?auth= */
    body: z
        .object({
            auth: authExchangeToken
        })
        .optional()
});

export const overlayExchangeSchema = z.object({
    query: z.object({
        overlayToken: z.string().min(20).max(4096).optional()
    })
});
