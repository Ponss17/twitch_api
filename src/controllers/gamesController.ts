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
        // Fallback: devolver mensajes con backticks
        const messages = generateDuelMessages(challenger, opponent);
        const response = messages.join('`');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(response);
    }

    // Responder inmediatamente a Nightbot (vacío)
    res.status(200).end();

    // Enviar mensajes en background (como rokbot)
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

// Envía mensajes a Nightbot (como rokbot: 2 instantáneos, resto con delay)
async function sendDuelMessagesToNightbot(responseUrl: string, challenger: string, opponent: string) {
    const messages = generateDuelMessages(challenger, opponent);

    for (let i = 0; i < messages.length; i++) {
        // Fire-and-forget: no esperamos respuesta
        apiService.sendToNightbot(responseUrl, messages[i])
            .catch(err => console.error(`[Nightbot] Error mensaje ${i + 1}:`, err.message));

        // Delay solo después del segundo mensaje (como rokbot con d=0)
        if (i === 1) {
            // Después del segundo mensaje, esperar 5 segundos
            await delay(5000);
        } else if (i > 1 && i < messages.length - 1) {
            // Entre mensajes 3-6, esperar 5 segundos
            await delay(5000);
        }
        // Mensajes 1 y 2 son instantáneos (sin delay entre ellos)
    }
}
