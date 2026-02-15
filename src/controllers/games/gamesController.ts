import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { generateMagic8Response } from '../../services/games/magic8Service';

import { playRussianRoulette } from '../../services/games/russianService';
import { playDuel } from '../../services/games/duelService';
import { MESSAGES } from '../../config/messages';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

// ==========================================
// MINIJUEGOS
// ==========================================

// ==========================================
// Bola 8 Mágica
// ==========================================

import { safeString } from '../../utils/validationHelpers';

// ...

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const question = safeString(req.query.question);
        const mood = safeString(req.query.mood);
        const user = safeString(req.query.user);

        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                error: MESSAGES.MAGIC8.QUESTION_REQUIRED
            });
        }

        const answer = await generateMagic8Response(question, mood as string, user as string);

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
        let token = req.twitchToken;

        if (!token) return res.status(401).send('No token provided');

        const isHardcore = hardcore === 'true';

        let attempts = 0;
        const maxAttempts = 2;
        const apiKey = (req.query.apiKey as string) || (req.headers['x-api-key'] as string);

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const result = await playRussianRoulette(
                    channel as string,
                    user as string,
                    token || '',
                    isHardcore
                );

                if (format === 'json') {
                    return res.json(result);
                } else {
                    return res.send(result.message);
                }
            } catch (error: unknown) {
                const err = error as any;
                const is401 = err?.message?.includes('401') || err?.status === 401;

                if (is401 && apiKey && attempts < maxAttempts) {
                    logger.warn(`[RUSSIAN] 401 detected (attempt ${attempts}), refreshing...`);
                    try {
                        const authData = await import('../../services/auth/authService').then((m) =>
                            m.getValidToken(apiKey)
                        );
                        token = authData.accessToken;
                        continue;
                    } catch (refreshErr) {
                        logger.error('[RUSSIAN] Refresh failed:', refreshErr);
                    }
                }
                throw error;
            }
        }
    } catch (error) {
        logger.error('Error en playRussian:', error);
        res.status(500).send('Error interno en la Ruleta Rusa');
    }
};

// ==========================================
// Duelo
// ==========================================

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const target = safeString(req.query.target);
        const challenger = safeString(req.query.challenger);

        if (!target || typeof target !== 'string') {
            return res.status(400).send('Debes especificar un oponente (@usuario)');
        }

        const cleanTarget = target.replace(/^@/, '');
        const challengerStr = (challenger as string) || 'Keanu Reeves';
        const cleanChallenger = challengerStr.replace(/^@/, '');

        const result = await playDuel(cleanChallenger, cleanTarget);

        res.send(result.message);
    } catch (error) {
        logger.error('Error en startDuel:', error);
        res.status(500).send('Error al iniciar el duelo');
    }
};
