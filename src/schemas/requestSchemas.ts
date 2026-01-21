import { z } from 'zod';

export const createClipSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal no puede estar vacío'),
    }),
});

export const aiChatSchema = z.object({
    body: z.object({
        prompt: z.string().optional(),
        history: z.array(
            z.object({
                role: z.enum(['user', 'assistant', 'system']),
                content: z.string()
            })
        ).optional()
    }).refine(data => data.prompt || (data.history && data.history.length > 0), {
        message: "Se requiere 'prompt' o un 'history' no vacío",
        path: ["prompt"]
    })
});

export const duelSchema = z.object({
    query: z.object({
        challenger: z.string().min(1),
        opponent: z.string().min(1)
    })
});
