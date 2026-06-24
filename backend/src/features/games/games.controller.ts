import { Response } from 'express';
import { logger } from '../../core/utils/logger';
import * as magic8Service from './magic8.service';
import * as russianService from './russian.service';
import * as duelService from './duel.service';
import * as authService from '../../features/auth/auth.service';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { ANONYMOUS_USER_ID } from '../../types/constants';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';

/**
 * Helper para obtener credenciales de respaldo si no hay sesión activa (para comandos de chat)
 */
const getFallbackAuth = async (req: AuthenticatedRequest) => {
    const channel = (req.query.channel as string) || (req.query.user as string);
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
    try {
        const question = req.query.question as string;
        const mood = req.query.mood as string;
        const user = req.query.user as string;

        // Fallback para tracking si no hay sesión
        let effectiveUserId = req.userId;
        if (!effectiveUserId) {
            const fallback = await getFallbackAuth(req);
            effectiveUserId = fallback?.userId || ANONYMOUS_USER_ID;
        }

        const answer = await trackRequest(
            effectiveUserId,
            {
                type: 'magic8',
                user: user || 'Anónimo',
                detail: question,
                incrementStat: 'magic8'
            },
            () => magic8Service.generateMagic8Response(question, mood as string, user as string)
        );

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.send(answer);
    } catch (error) {
        logger.error('Error en askMagic8:', error);
        res.status(500).send(MESSAGES.MAGIC8.GROQ_ERROR);
    }
};

// ==========================================
// Ruleta Rusa
// ==========================================

export const playRussian = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { user, channel, hardcore, format } = req.query;

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

        const result = await trackRequest(
            effectiveUserId || ANONYMOUS_USER_ID,
            {
                type: 'russian',
                user: (user as string) || 'Anónimo',
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
                            sendToChat
                        );
                    },
                    'RUSSIAN'
                );
            }
        );

        if (result) {
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
        const target = req.query.target as string;
        const challenger = (req.query.challenger as string) || 'KeanuReeves';

        // Fallback para tracking si no hay sesión
        let effectiveUserId = req.userId;
        if (!effectiveUserId) {
            const fallback = await getFallbackAuth(req);
            effectiveUserId = fallback?.userId || ANONYMOUS_USER_ID;
        }

        const result = await trackRequest(
            effectiveUserId,
            {
                type: 'duel',
                user: challenger,
                detail: target,
                incrementStat: 'duel'
            },
            () => Promise.resolve(duelService.playDuel(challenger, target))
        );

        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send(MESSAGES.COMMANDS.DUEL_ERROR);
    }
};
