import { z } from 'zod';

export const getClipsSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal es obligatorio'),
        limit: z.coerce.number().min(1).max(100).default(20)
    })
});

export const getChattersSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal es obligatorio')
    })
});

export const getUserInfoSchema = z.object({
    query: z.object({
        login: z.string().min(1, 'El login es obligatorio')
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
