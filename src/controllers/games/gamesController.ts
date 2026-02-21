import { Response } from 'express';
import { logger } from '../../utils/logger';
import { generateMagic8Response } from '../../services/games/magic8Service';
import { playRussianRoulette } from '../../services/games/russianService';
import { playDuel } from '../../services/games/duelService';
import * as dbService from '../../services/infrastructure/dbService';
import { MESSAGES } from '../../config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString } from '../../utils/validationHelpers';
import { withTwitchAuth } from '../../utils/twitchAuthHelpers';

// ==========================================
// MINIJUEGOS
// ==========================================

// ==========================================
// Bola 8 Mágica
// ==========================================

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const question = safeString(req.query.question);
        const mood = safeString(req.query.mood);
        const user = safeString(req.query.user);

        if (!question) {
            return res.status(400).json({
                error: MESSAGES.MAGIC8.QUESTION_REQUIRED
            });
        }

        const answer = await generateMagic8Response(question, mood as string, user as string);

        if (req.userId) {
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
            async (token) => {
                return await playRussianRoulette(
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
        const target = safeString(req.query.target);
        const challenger = safeString(req.query.challenger);

        if (!target) {
            return res.status(400).send(MESSAGES.COMMANDS.MISSING_OPPONENT);
        }

        const challengerStr = challenger || 'Keanu Reeves';

        const result = await playDuel(challengerStr, target);

        if (req.userId) {
            await dbService.addUserActivity(req.userId, {
                type: 'duel',
                user: challengerStr,
                detail: target
            });
        }

        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send(MESSAGES.COMMANDS.DUEL_ERROR);
    }
};
