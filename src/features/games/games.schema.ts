import { z } from 'zod';

export const askMagic8Schema = z.object({
    query: z.object({
        question: z
            .string()
            .min(3, 'La pregunta debe tener al menos 3 caracteres')
            .max(500, 'Pregunta demasiado larga'),
        mood: z.string().optional(),
        user: z.string().optional()
    })
});

export const playRussianSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El canal es obligatorio'),
        user: z.string().min(1, 'El usuario es obligatorio'),
        hardcore: z.enum(['true', 'false']).optional(),
        format: z.enum(['text', 'json']).optional()
    })
});

export const startDuelSchema = z.object({
    query: z.object({
        target: z.string().min(1, 'El oponente es obligatorio'),
        challenger: z.string().optional()
    })
});
