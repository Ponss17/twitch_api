import { z } from 'zod';

const twitchUsername = z
    .string()
    .trim()
    .min(1)
    .max(25)
    .regex(/^[a-zA-Z0-9_]+$/, 'Nombre de usuario Twitch inválido');

export const createClipSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        q: z.string().optional(),
        title: z.string().max(140).optional(),
        template: z.string().max(500).optional()
    })
});

export const followageSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        user: twitchUsername,
        template: z.string().max(500).optional()
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
        touser: twitchUsername,
        template: z.string().max(500).optional()
    })
});
