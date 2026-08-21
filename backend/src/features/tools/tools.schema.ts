import { z } from 'zod';
import { twitchUsername } from '../../core/schemas/twitchUsername';
import { TOOL_USAGE_ENUM, TOOL_USAGE_TYPES } from '../../core/schemas/commandCatalog';

/** Schemas de herramientas del panel (clips / chatters / track-usage). */

export const getClipsSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        limit: z.coerce.number().min(1).max(100).default(20)
    })
});

/** IDs de clip Helix: slug alfanumérico con guiones (hasta ~100 chars). */
export const getClipDownloadSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        clip_id: z
            .string()
            .trim()
            .min(1)
            .max(128)
            .regex(/^[A-Za-z0-9_-]+$/)
    })
});

export const getChattersSchema = z.object({
    query: z.object({
        channel: twitchUsername,
        eligibility: z
            .string()
            .max(48)
            .regex(/^(all|(subs|mods|vips|viewers)(,(subs|mods|vips|viewers))*)$/)
            .optional()
    })
});

export const trackUsageSchema = z.object({
    body: z.object({
        tool: z.enum(TOOL_USAGE_ENUM, {
            message: `Herramienta inválida. Valores: ${TOOL_USAGE_TYPES.join(', ')}`
        })
    })
});
