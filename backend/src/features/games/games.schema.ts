import { z } from 'zod';

const twitchUsername = z
    .string()
    .trim()
    .transform((s) => s.replace(/^@+/, ''))
    .pipe(
        z
            .string()
            .min(1)
            .max(25)
            .regex(/^[a-zA-Z0-9_]+$/, 'Nombre de usuario Twitch inválido')
    );

export const askMagic8Schema = z.object({
    query: z.object({
        question: z
            .string()
            .min(3, 'La pregunta debe tener al menos 3 caracteres')
            .max(500, 'Pregunta demasiado larga'),
        mood: z.enum(['classic', 'sarcastic', 'toxic', 'helpful']).optional(),
        user: twitchUsername.optional()
    })
});

export const playRussianSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        user: twitchUsername,
        hardcore: z.enum(['true', 'false']).optional(),
        format: z.enum(['text', 'json']).optional()
    })
});

export const startDuelSchema = z.object({
    query: z.object({
        target: twitchUsername,
        challenger: z.preprocess(
            (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
            twitchUsername.optional()
        )
    })
});
