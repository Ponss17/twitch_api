import { z } from 'zod';

const twitchUsername = z
    .string()
    .trim()
    .min(1)
    .max(25)
    .regex(/^[a-zA-Z0-9_]+$/, 'Nombre de usuario Twitch inválido');

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
        timezone: z.string().min(1, 'La zona horaria es requerida.')
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

