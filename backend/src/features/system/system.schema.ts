import { z } from 'zod';

export const regenerateKeySchema = z.object({
    body: z.object({}).optional()
});

export const submitFeedbackSchema = z.object({
    body: z.object({
        message: z
            .string()
            .min(1, 'El mensaje es obligatorio')
            .max(2000, 'El mensaje es demasiado largo')
    })
});
