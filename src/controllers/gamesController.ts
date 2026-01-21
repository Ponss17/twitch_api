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

    if (!token || !broadcasterId) {
        return res.status(401).send(MESSAGES.SYSTEM.UNAUTHORIZED);
    }

    try {
        await sendWithRetry(broadcasterId, `⏳ ${challenger} está desafiando a ${opponent}...`, token);
        await delay(1000);

        const isChallengerWin = Math.random() > 0.5;
        const winner = isChallengerWin ? challenger : opponent;
        const loser = isChallengerWin ? opponent : challenger;

        const intro = `⚔️ ¡${challenger} desafía a ${opponent} a un duelo a muerte con cuchillos! 🔪`;

        const actions = [
            `💨 ${challenger} intenta flanquear...`,
            `🛡️ ${opponent} levanta la guardia...`,
            `💥 ¡Intercambio de golpes brutal!`,
            `🔥 ¡${winner} lanza su ataque final!`,
            `💀 ${loser} cae derrotado... ¡${winner} gana! 🏆`
        ];

        await sendWithRetry(broadcasterId, intro, token);
        await delay(1200);

        for (const action of actions) {
            await sendWithRetry(broadcasterId, action, token);
            await delay(1200);
        }

        res.send('Duelo finalizado');

    } catch (error) {
        console.error('Error en duelo:', error);
        try {
            await apiService.sendChatMessage(broadcasterId, broadcasterId, `⚠️ Error en el duelo.`, token);
        } catch (e) { /* Nada que hacer */ }

        if (!res.headersSent) {
            res.status(500).send('Error executing duel');
        }
    }
};
