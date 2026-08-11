import { z } from 'zod';
import { twitchUsernameWithAtStrip } from '../../core/schemas/twitchUsername';

const twitchUsername = twitchUsernameWithAtStrip;
const nightbotInterval = z.coerce.number().int().min(5).max(10).default(5);

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
        ),
        lang: z.string().max(8).optional(),
        interval: nightbotInterval
    })
});

export const playSlotsSchema = z.object({
    query: z.object({
        user: twitchUsername.optional(),
        channel: twitchUsername.optional(),
        lang: z.string().max(8).optional(),
        interval: nightbotInterval
    })
});
