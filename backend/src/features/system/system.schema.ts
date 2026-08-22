import { z } from 'zod';

export const regenerateKeySchema = z.object({
    body: z.object({}).optional()
});

export const submitFeedbackSchema = z.object({
    body: z.object({
        type: z.enum(['bug', 'suggestion', 'general']).default('general'),
        message: z
            .string()
            .min(1, 'El mensaje es obligatorio')
            .max(2000, 'El mensaje es demasiado largo'),
        anonymous: z.boolean().optional().default(false),
        identity: z.enum(['twitch', 'discord']).optional(),
        discordUsername: z.string().max(100).optional()
    })
});
