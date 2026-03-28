import { Response } from 'express';
import { logger } from '../../core/utils/logger';
import * as magic8Service from './magic8.service';
import * as russianService from './russian.service';
import * as duelService from './duel.service';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';

// ==========================================
// Bola 8 Mágica
// ==========================================

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const question = req.query.question as string;
        const mood = req.query.mood as string;
        const user = req.query.user as string;

        const answer = await trackRequest(
            req.userId,
            {
                type: 'magic8',
                user: user || 'Anónimo',
                detail: question,
                incrementStat: 'magic8'
            },
            () => magic8Service.generateMagic8Response(question, mood as string, user as string)
        );

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
        if (!req.twitchToken) return res.status(401).send(MESSAGES.AUTH.NO_TOKEN);

        const isHardcore = hardcore === 'true';
        const sendToChat = format !== 'json';

        const result = await trackRequest(
            req.userId,
            {
                type: 'russian',
                user: (user as string) || 'Anónimo',
                incrementStat: 'russian'
            },
            async () => {
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
        const challenger = (req.query.challenger as string) || 'Keanu Reeves';

        const result = await trackRequest(
            req.userId,
            {
                type: 'duel',
                user: challenger,
                detail: target,
                incrementStat: 'duel'
            },
            () => duelService.playDuel(challenger, target)
        );

        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send(MESSAGES.COMMANDS.DUEL_ERROR);
    }
};
