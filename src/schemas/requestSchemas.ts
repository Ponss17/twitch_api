import { z } from 'zod';

export const createClipSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal no puede estar vacío'),
    }),
});

export const magic8Schema = z.object({
    query: z.object({
        question: z.string()
            .min(3, 'La pregunta debe tener al menos 3 caracteres')
            .max(500, 'La pregunta es demasiado larga (max 500 caracteres)'),
        user: z.string().optional()
    })
});

