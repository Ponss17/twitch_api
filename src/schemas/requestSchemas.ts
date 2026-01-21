import { z } from 'zod';

export const createClipSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El nombre del canal no puede estar vacío'),
    }),
});

