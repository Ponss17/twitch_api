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

    // Generar mensajes del duelo
    const messages = generateDuelMessages(challenger, opponent);

    // Devolver todos los mensajes separados por backticks (como rokbot)
    // Nightbot interpretará cada segmento como un mensaje separado
    const response = messages.join('`');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(response);
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

