import { z } from 'zod';

export const createClipSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El canal es obligatorio'),
        q: z.string().optional(),
        title: z.string().optional(),
        template: z.string().optional()
    })
});

export const followageSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El canal es obligatorio'),
        user: z.string().min(1, 'El usuario es obligatorio'),
        template: z.string().optional()
    })
});

export const sendMessageSchema = z.object({
    body: z.object({
        message: z
            .string()
            .min(1, 'El mensaje no puede estar vacío')
            .max(500, 'Mensaje demasiado largo')
    })
});

export const shoutoutSchema = z.object({
    query: z.object({
        channel: z.string().min(1, 'El canal es obligatorio'),
        touser: z.string().min(1, 'El usuario destino es obligatorio'),
        template: z.string().optional()
    })
});
