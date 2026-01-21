import { Request, Response } from 'express';
import * as apiService from '../services/apiService';
import { MESSAGES } from '../config/messages';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendWithRetry = async (broadcasterId: string, message: string, token: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await apiService.sendChatMessage(broadcasterId, broadcasterId, message, token);
            return;
        } catch (error) {
            console.warn(`Intento ${i + 1} fallido para enviar mensaje:`, message);
            if (i === retries - 1) throw error;
            await delay(1000);
        }
    }
};

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    const challenger = req.query.challenger as string;
    const opponent = req.query.opponent as string;

    try {
        const isChallengerWin = Math.random() > 0.5;
        const winner = isChallengerWin ? challenger : opponent;
        const loser = isChallengerWin ? opponent : challenger;

        const messages = [
            `⚔️ ¡Duelo a muerte con cuchillos! 🔪`,
            `💨 ${challenger} intenta flanquear...`,
            `🛡️ ${opponent} levanta la guardia...`,
            `💥 ¡Intercambio de golpes brutal!`,
            `🔥 ¡${winner} lanza su ataque final!`,
            `💀 ${loser} cae derrotado... ¡${winner} gana! 🏆`
        ];

        const response = messages.join('`');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(response);

    } catch (error) {
        console.error('Error en duelo:', error);
        res.status(500).send('⚠️ Error en el duelo.');
    }
};
