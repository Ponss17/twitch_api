import { Request, Response } from 'express';
import * as apiService from '../services/apiService';

interface AuthenticatedRequest extends Request { }

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// DUELOS
// ==========================================

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    const challenger = req.query.challenger as string;
    const opponent = req.query.opponent as string;

    const nightbotResponseUrl = req.headers['nightbot-response-url'] as string;

    if (!nightbotResponseUrl) {
        return res.status(400).send('Este endpoint solo funciona con Nightbot');
    }

    res.send(' ');
    sendDuelMessagesToNightbot(nightbotResponseUrl, challenger, opponent);
};

// Genera los mensajes del duelo
function generateDuelMessages(challenger: string, opponent: string): string[] {
    const isChallengerWin = Math.random() > 0.5;
    const winner = isChallengerWin ? challenger : opponent;
    const loser = isChallengerWin ? opponent : challenger;

    return [
        `⚔️ ¡Duelo a muerte con cuchillos! 🔪`,
        `💨 ${challenger} intenta flanquear...`,
        `🛡️ ${opponent} levanta la guardia...`,
        `💥 ¡Intercambio de golpes brutal!`,
        `🔥 ¡${winner} lanza su ataque final!`,
        `💀 ${loser} cae derrotado... ¡${winner} gana! 🏆`
    ];
}

// Envía mensajes a Nightbot con delays
async function sendDuelMessagesToNightbot(responseUrl: string, challenger: string, opponent: string) {
    const messages = generateDuelMessages(challenger, opponent);

    for (let i = 0; i < messages.length; i++) {
        try {
            await apiService.sendToNightbot(responseUrl, messages[i]);
            if (i < messages.length - 1) {
                await delay(5000);
            }
        } catch (error) {
            console.error(`Error enviando mensaje ${i + 1} a Nightbot:`, error);
            break;
        }
    }
}
