import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/twitch';
import { jsonError } from '../../core/utils/jsonResponse';
import { MESSAGES } from '../../core/config/messages';
import { getUser } from '../../core/database/userService';
import { getValidTokenForUser } from '../auth/auth.service';
import {
    announceBitsWinner,
    disableBitsAlert,
    enableBitsAlert,
    getBitsAlertSubscription,
    publishTestCheer
} from './bitsRoulette.service';

export const bitsAlertToggleSchema = z.object({
    body: z.object({
        enabled: z.boolean()
    })
});

export const bitsAlertAnnounceSchema = z.object({
    body: z.object({
        cheerId: z.string().trim().min(1).max(128),
        prize: z.string().trim().min(1).max(40),
        lang: z.enum(['es', 'en', 'pt']).optional()
    })
});

export const bitsAlertTestSchema = z.object({
    body: z
        .object({
            bits: z.number().int().min(1).max(100_000).optional()
        })
        .optional()
});

export const getBitsAlertHandler = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    const subscription = await getBitsAlertSubscription(userId);
    return res.json({ subscription });
};

export const putBitsAlertHandler = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    const enabled = Boolean((req.body as { enabled?: boolean })?.enabled);

    try {
        if (enabled) {
            const { subscription, localOnly } = await enableBitsAlert(userId);
            return res.json({
                subscription,
                localOnly,
                message: localOnly
                    ? 'Activado en modo local: usa «Probar en OBS». EventSub (bits reales) solo funciona con la API pública en producción.'
                    : undefined
            });
        }
        const subscription = await disableBitsAlert(userId);
        return res.json({ subscription, localOnly: false });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'CONFIG_ERROR';
        if (msg === 'EVENTSUB_CREATE_FAILED') {
            return jsonError(
                res,
                502,
                'Twitch rechazó la suscripción a bits. Revisa bits:read (Actualizar permisos) y que el callback EventSub sea HTTPS público.'
            );
        }
        if (msg === 'KV_UNAVAILABLE') {
            return jsonError(res, 503, 'Almacenamiento temporalmente no disponible.');
        }
        return jsonError(res, 500, 'No se pudo actualizar la alerta de bits.');
    }
};

export const announceBitsWinnerHandler = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    const body = req.body as { cheerId: string; prize: string; lang?: 'es' | 'en' | 'pt' };

    let token = req.twitchToken;
    if (!token) {
        const user = await getUser(userId);
        if (!user) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
        try {
            token = (await getValidTokenForUser(user)).accessToken;
        } catch {
            return jsonError(res, 502, 'No se pudo usar la sesión de Twitch para escribir en el chat.');
        }
    }

    try {
        const result = await announceBitsWinner({
            userId,
            token,
            cheerId: body.cheerId,
            prize: body.prize,
            lang: body.lang
        });
        if (result === 'stale') {
            return jsonError(res, 409, 'Ese cheer ya no se puede anunciar.');
        }
        return res.json({ success: true, sent: result === 'sent' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'CHAT_ERROR';
        if (msg === 'KV_UNAVAILABLE') {
            return jsonError(res, 503, 'Almacenamiento temporalmente no disponible.');
        }
        return jsonError(res, 502, 'No se pudo enviar el premio al chat.');
    }
};

export const testBitsAlertHandler = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    const bits = Number((req.body as { bits?: number })?.bits) || 100;
    await publishTestCheer(userId, bits);
    return res.json({ success: true, bits });
};
