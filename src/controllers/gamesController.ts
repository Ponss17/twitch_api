import { Request, Response } from 'express';
import * as apiService from '../services/apiService';
import { MESSAGES } from '../config/messages';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    const challenger = req.query.challenger as string;
    const opponent = req.query.opponent as string;
    const token = req.twitchToken;
    const broadcasterId = req.userId;

    if (!token || !broadcasterId) {
        return res.status(401).send(MESSAGES.SYSTEM.UNAUTHORIZED);
    }

    res.send(' ');

    try {
        await apiService.sendChatMessage(broadcasterId, broadcasterId, `⏳ ${challenger} está desafiando a ${opponent}...`, token);
        await delay(1500);

        const isChallengerWin = Math.random() > 0.5;
        const winner = isChallengerWin ? challenger : opponent;
        const loser = isChallengerWin ? opponent : challenger;

        const intro = `⚔️ ¡${challenger} desafía a ${opponent} a un duelo a muerte con cuchillos! 🔪`;

        const actions = [
            `💨 ${challenger} se mueve rápidamente intentando flanquear...`,
            `🛡️ ${opponent} levanta la guardia esperando el golpe...`,
            `💥 ¡Hubo un intercambio de golpes brutal! Ambos están heridos...`,
            `🔥 ¡${winner} encuentra una apertura y lanza su ataque final!`,
            `💀 ${loser} cae derrotado al suelo... ¡${winner} gana el duelo! 🏆`
        ];

        await apiService.sendChatMessage(broadcasterId, broadcasterId, intro, token);
        await delay(2000);

        for (const action of actions) {
            await apiService.sendChatMessage(broadcasterId, broadcasterId, action, token);
            await delay(2500);
        }

    } catch (error) {
        console.error('Error en duelo:', error);
        try {
            await apiService.sendChatMessage(broadcasterId, broadcasterId, `⚠️ El duelo entre ${challenger} y ${opponent} fue cancelado por intervención divina (Error).`, token);
        } catch (e) { /* Nada que hacer */ }
    }
};
