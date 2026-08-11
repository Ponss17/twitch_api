import { safeString } from '../../core/utils/validationHelpers';
import { Response } from 'express';
import { logger } from '../../core/utils/logger';
import * as magic8Service from './magic8.service';
import * as russianService from './russian.service';
import * as duelService from './duel.service';
import * as slotsService from './slots.service';
import * as nightbotResponse from '../integrations/nightbotResponse';
import * as authService from '../auth/auth.service';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { ANONYMOUS_USER_ID } from '../../types/constants';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';

/**
 * Helper para obtener credenciales de respaldo si no hay sesión activa (para comandos de chat)
 */
const getFallbackAuth = async (req: AuthenticatedRequest) => {
    const channel = safeString(req.query.channel) || safeString(req.query.user);
    if (!channel) return null;
    try {
        return await authService.getValidTokenByLogin(channel);
    } catch (error) {
        logger.warn(`No se pudo obtener fallback auth para canal ${channel}:`, error);
        return null;
    }
};

// ==========================================
// Bola 8 Mágica
// ==========================================

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    try {
        const question = safeString(req.query.question);
        const mood = safeString(req.query.mood);
        let user = safeString(req.query.user);
        if (user?.includes('$(') || user?.includes('${')) user = 'Anónimo';

        // Fallback para tracking si no hay sesión
        let effectiveUserId = req.userId;
        if (!effectiveUserId) {
            const fallback = await getFallbackAuth(req);
            effectiveUserId = fallback?.userId || ANONYMOUS_USER_ID;
        }

        const lang = safeString(req.query.lang) || 'es';

        const answer = await trackRequest(
            effectiveUserId,
            {
                type: 'magic8',
                user: user || 'Anónimo',
                metadata: { question },
                incrementStat: 'magic8'
            },
            () => magic8Service.generateMagic8Response(question, mood as string, user as string, lang),
            req
        );

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.send(answer);
    } catch (error) {
        logger.error('Error en askMagic8:', error);
        if (error instanceof Error && error.message === MESSAGES.MAGIC8.MISSING_API_KEY) {
            return res.status(503).send(MESSAGES.MAGIC8.MISSING_API_KEY);
        }
        return res.status(500).send(MESSAGES.MAGIC8.GROQ_ERROR);
    }
};

// ==========================================
// Ruleta Rusa
// ==========================================

export const playRussian = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { channel, hardcore, format } = req.query;
        let user = safeString(req.query.user);
        if (user?.includes('$(') || user?.includes('${')) user = 'Anónimo';

        // Fallback de Token: Si no hay token de sesión, buscamos el del propio canal/streamer
        let twitchToken = req.twitchToken;
        let effectiveUserId = req.userId;

        if (!twitchToken) {
            const fallback = await getFallbackAuth(req);
            if (!fallback) return res.status(401).send(MESSAGES.AUTH.NO_TOKEN);
            twitchToken = fallback.accessToken;
            effectiveUserId = fallback.userId;
        }

        const isHardcore = hardcore === 'true';
        const sendToChat = req.query.sendToChat === 'true';
        const lang = safeString(req.query.lang) || 'es';

        const result = await trackRequest(
            effectiveUserId || ANONYMOUS_USER_ID,
            {
                type: 'russian',
                user: user || 'Anónimo',
                metadata: { target: channel },
                incrementStat: 'russian'
            },
            async () => {
                req.twitchToken = twitchToken; // Inyectamos el token para el helper
                return await withTwitchAuth(
                    req,
                    res,
                    async (token: string) => {
                        return await russianService.playRussianRoulette(
                            channel as string,
                            user as string,
                            token,
                            isHardcore,
                            sendToChat,
                            lang
                        );
                    },
                    'RUSSIAN'
                );
            },
            req
        );

        if (result) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            if (format === 'json') return res.json(result);
            return res.send(result.message);
        }
    } catch (error) {
        logger.error('Error en playRussian:', error);
        res.status(500).send(MESSAGES.COMMANDS.RUSSIAN_ERROR);
    }
};

// ==========================================
// Duelo
// ==========================================

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const target = safeString(req.query.target);
        let challenger = safeString(req.query.challenger) || 'KeanuReeves';
        if (challenger?.includes('$(') || challenger?.includes('${')) challenger = 'Anónimo';
        const lang = safeString(req.query.lang) || 'es';

        let effectiveUserId = req.userId;
        if (!effectiveUserId) {
            const fallback = await getFallbackAuth(req);
            effectiveUserId = fallback?.userId || ANONYMOUS_USER_ID;
        }

        const intervalSec = Math.min(10, Math.max(5, Number(req.query.interval) || 5));

        const result = await trackRequest(
            effectiveUserId,
            {
                type: 'duel',
                user: challenger,
                metadata: { target },
                incrementStat: 'duel'
            },
            () => Promise.resolve(duelService.playDuel(challenger, target, lang)),
            req
        );

        // Nightbot: 1er mensaje en el body del urlfetch; 2 y 3 vía Nightbot-Response-Url (como rokbot).
        const nightbotUrl = nightbotResponse.getNightbotResponseUrl(
            req.headers as Record<string, unknown>
        );
        if (nightbotUrl && result.messages?.length > 1) {
            const [first, ...rest] = result.messages;
            // Registrar waitUntil ANTES de responder (si no, Vercel corta el 3.er mensaje).
            const followUps = nightbotResponse.scheduleNightbotFollowUps(
                nightbotUrl,
                rest,
                intervalSec
            );
            nightbotResponse.keepAliveAfterResponse(followUps);
            return res.send(first);
        }

        // StreamElements / Fossabot / preview: un solo mensaje (esos bots no tienen Response-Url).
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send(MESSAGES.COMMANDS.DUEL_ERROR);
    }
};

// ==========================================
// Slots
// ==========================================

export const playSlots = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let user = safeString(req.query.user);
        if (user?.includes('$(') || user?.includes('${')) user = 'Anónimo';
        const lang = safeString(req.query.lang) || 'es';

        let effectiveUserId = req.userId;
        if (!effectiveUserId) {
            const fallback = await getFallbackAuth(req);
            effectiveUserId = fallback?.userId || ANONYMOUS_USER_ID;
        }

        const intervalSec = Math.min(10, Math.max(5, Number(req.query.interval) || 5));

        const result = await trackRequest(
            effectiveUserId,
            {
                type: 'slots',
                user: user || 'Anónimo',
                incrementStat: 'slots'
            },
            () => Promise.resolve(slotsService.playSlots(user, lang)),
            req
        );

        const nightbotUrl = nightbotResponse.getNightbotResponseUrl(
            req.headers as Record<string, unknown>
        );
        if (nightbotUrl && result.messages?.length > 1) {
            const [first, ...rest] = result.messages;
            const followUps = nightbotResponse.scheduleNightbotFollowUps(
                nightbotUrl,
                rest,
                intervalSec
            );
            nightbotResponse.keepAliveAfterResponse(followUps);
            return res.send(first);
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(result.message);
    } catch (error) {
        logger.error('Error en playSlots:', error);
        res.status(500).send(MESSAGES.COMMANDS.SLOTS_ERROR);
    }
};
