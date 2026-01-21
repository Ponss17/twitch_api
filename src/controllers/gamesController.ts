import { Request, Response } from 'express';
import * as apiService from '../services/apiService';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// DUELOS
// ==========================================

export const startDuel = async (req: AuthenticatedRequest, res: Response) => {
    const challenger = req.query.challenger as string;
    const opponent = req.query.opponent as string;
    const token = req.twitchToken;
    const userId = req.userId;

    if (!token || !userId) {
        return res.status(401).send('No autorizado');
    }

    try {
        // Generar mensajes del duelo
        const messages = generateDuelMessages(challenger, opponent);

        // Enviar mensajes con delays optimizados
        for (let i = 0; i < messages.length; i++) {
            await apiService.sendChatMessage(userId, userId, messages[i], token);

            // Delay de 1 segundo entre mensajes (total ~6 segundos)
            if (i < messages.length - 1) {
                await delay(1000);
            }
        }

        res.send('¡Duelo iniciado!');
    } catch (error) {
        console.error('Error en duelo:', error);
        res.status(500).send('Error al iniciar el duelo');
    }
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
