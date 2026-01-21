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
    const token = req.twitchToken;
    const broadcasterId = req.userId;


    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const isChallengerWin = Math.random() > 0.5;
        const winner = isChallengerWin ? challenger : opponent;
        const loser = isChallengerWin ? opponent : challenger;

        const intro = `⚔️ ¡Duelo a muerte con cuchillos! 🔪 `;
        res.write(intro);

        await delay(1000);

        const actions = [
            `💨 ${challenger} intenta flanquear... `,
            `🛡️ ${opponent} levanta la guardia... `,
            `💥 ¡Intercambio de golpes brutal! `,
            `🔥 ¡${winner} lanza su ataque final! `,
            `💀 ${loser} cae derrotado... ¡${winner} gana! 🏆 `
        ];

        for (const action of actions) {
            res.write(action);
            await delay(1200);
        }

        res.end();

    } catch (error) {
        console.error('Error en duelo:', error);
        res.write('⚠️ Error en el duelo.');
        res.end();
    }
};
