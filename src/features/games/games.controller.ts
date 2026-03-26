import { Response } from 'express';
import { logger } from '../../core/utils/logger';
import * as magic8Service from './magic8.service';
import * as russianService from './russian.service';
import * as duelService from './duel.service';
import * as dbService from '../../core/database/dbService';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';

// ==========================================
// MINIJUEGOS
// ==========================================

// ==========================================
// Bola 8 Mágica
// ==========================================

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const question = req.query.question as string;
        const mood = req.query.mood as string;
        const user = req.query.user as string;

        const answer = await magic8Service.generateMagic8Response(
            question,
            mood as string,
            user as string
        );

        if (req.userId) {
            await dbService.incrementUserStats(req.userId, 'magic8');
            await dbService.addUserActivity(req.userId, {
                type: 'magic8',
                user: user || 'Anónimo',
                detail: question
            });
        }

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

        const result = await withTwitchAuth(
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

        if (result) {
            if (req.userId) {
                await dbService.incrementUserStats(req.userId, 'russian');
                await dbService.addUserActivity(req.userId, {
                    type: 'russian',
                    user: (user as string) || 'Anónimo'
                });
            }

            if (format === 'json') {
                return res.json(result);
            }
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

        const result = await duelService.playDuel(challenger, target);

        if (req.userId) {
            await dbService.incrementUserStats(req.userId, 'duel');
            await dbService.addUserActivity(req.userId, {
                type: 'duel',
                user: challenger,
                detail: target
            });
        }

        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send(MESSAGES.COMMANDS.DUEL_ERROR);
    }
};
