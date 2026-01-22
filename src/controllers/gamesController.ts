import { Request, Response } from 'express';
import * as apiService from '../services/apiService';
import { generateMagic8Response } from '../services/magic8Service';
import { MESSAGES } from '../config/messages';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// MINIJUEGOS
// ==========================================

// ==========================================
// Bola 8 Mágica
// ==========================================

export const askMagic8 = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { question } = req.query;

        // Validar que exista la pregunta
        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                error: MESSAGES.MAGIC8.QUESTION_REQUIRED
            });
        }

        const answer = await generateMagic8Response(question);

        res.json({
            success: true,
            question,
            answer
        });

    } catch (error) {
        console.error('Error en askMagic8:', error);
        res.status(500).json({
            error: MESSAGES.MAGIC8.GROQ_ERROR
        });
    }
};
