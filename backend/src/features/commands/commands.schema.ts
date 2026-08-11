import { z } from 'zod';
import { twitchUsername } from '../../core/schemas/twitchUsername';

const createClipInput = z.object({
    channel: twitchUsername,
    user: twitchUsername.optional(),
    q: z.string().max(140).optional(),
    title: z.string().max(140).optional(),
    template: z.string().max(500).optional()
});

export const createClipSchema = z.object({
    query: createClipInput
});

export const createClipPostSchema = z.object({
    body: createClipInput
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

export const watchtimeSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        user: twitchUsername,
        lang: z.string().max(10).optional(),
        template: z.string().max(500).optional()
    })
});
