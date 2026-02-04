import { Request, Response } from 'express';
import { generateMagic8Response } from '../services/magic8Service';
import { playRussianRoulette } from '../services/russianService';
import { MESSAGES } from '../config/messages';

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

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { question, mood, user } = req.query;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                error: MESSAGES.MAGIC8.QUESTION_REQUIRED
            });
        }

        const answer = await generateMagic8Response(question, mood as string, user as string);

        res.send(answer);
    } catch (error) {
        console.error('Error en askMagic8:', error);
        res.status(500).send(MESSAGES.MAGIC8.GROQ_ERROR);
    }
};

// ==========================================
// Ruleta Rusa
// ==========================================

export const playRussian = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { user, channel, hardcore } = req.query;
        const token = req.twitchToken;

        if (!token) return res.status(401).send('No token provided');

        const isHardcore = hardcore === 'true';

        const result = await playRussianRoulette(
            channel as string,
            user as string,
            token,
            isHardcore
        );

        res.json(result);
    } catch (error) {
        console.error('Error en playRussian:', error);
        res.status(500).json({ error: 'Error interno en la Ruleta Rusa' });
    }
};
