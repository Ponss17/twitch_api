import { z } from 'zod';
import { twitchUsername } from '../../core/schemas/twitchUsername';

export const getClipsSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        limit: z.coerce.number().min(1).max(100).default(20)
    })
});

export const getChattersSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        eligibility: z
            .string()
            .max(48)
            .regex(/^(all|(subs|mods|vips|viewers)(,(subs|mods|vips|viewers))*)$/)
            .optional()
    })
});

const loginQuery = z.object({
    login: twitchUsername
});

export const getUserInfoSchema = z.object({ query: loginQuery });

export const getSummarySchema = z.object({ query: loginQuery });

export const getAnalyticsSchema = z.object({
    query: z.object({}).optional()
});

export const getActivitySchema = z.object({
    query: z.object({}).optional()
});

export const updateSettingsSchema = z.object({
    body: z.object({
        timezone: z
            .string()
            .min(1, 'La zona horaria es requerida.')
            .max(50, 'Identificador de zona horaria demasiado largo.')
            .regex(
                /^[A-Za-z0-9_/+-]+$/,
                'Formato de zona horaria inválido. Usa un identificador IANA (ej: America/Mexico_City).'
            )
    })
});

export const clearUserDataSchema = z.object({
    body: z.object({
        confirm: z.string().refine((val) => val === 'LIMPIAR', {
            message: 'Debes escribir LIMPIAR para confirmar esta acción.'
        })
    })
});

export const deleteAccountSchema = z.object({
    body: z.object({
        confirm: z.string().refine((val) => val === 'ELIMINAR', {
            message: 'Debes escribir ELIMINAR para confirmar esta acción.'
        })
    })
});

export const trackUsageSchema = z.object({
    body: z.object({
        tool: z.enum(['trends', 'stalker', 'roulette'] as const, {
            message: 'Herramienta inválida. Valores: trends, stalker, roulette'
        })
    })
});

export const getViewerLeaderboardSchema = z.object({
    query: z.object({
        range: z.enum(['today', '7d']).optional().default('today'),
        limit: z.coerce.number().min(1).max(25).optional().default(10)
    })
});
