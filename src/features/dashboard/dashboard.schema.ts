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
        channel: twitchUsername
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
