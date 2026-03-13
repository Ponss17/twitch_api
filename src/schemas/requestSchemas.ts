import { z } from 'zod';

export const createClipSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal no puede estar vacío'),
        q: z.string().optional(),
        title: z.string().optional(),
        template: z.string().optional()
    })
});

export const magic8Schema = z.object({
    query: z.object({
        question: z
            .string()
            .min(3, 'La pregunta debe tener al menos 3 caracteres')
            .max(500, 'La pregunta es demasiado larga (max 500 caracteres)'),
        user: z.string().optional()
    })
});

export const followageSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal es requerido'),
        user: z.string().min(1, 'El nombre del usuario es requerido')
    })
});

export const shoutoutSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal es requerido'),
        touser: z.string().min(1, 'El usuario a destacar es requerido')
    })
});

export const russianSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El canal es requerido'),
        user: z.string().min(1, 'El usuario es requerido')
    })
});

export const duelSchema = z.object({
    query: z.object({
        target: z.string().min(1, 'El usuario retado es requerido'),
        challenger: z.string().optional()
    })
});
