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

    // Log para debugging
    console.log('Nightbot Response URL:', nightbotResponseUrl);
    console.log('All headers:', req.headers);

    if (!nightbotResponseUrl) {
        console.error('No Nightbot-Response-Url header found');
        return res.status(400).send('Este endpoint solo funciona cuando es llamado por Nightbot. El header "Nightbot-Response-Url" no está presente.');
    }

    // Responder inmediatamente sin mensaje (Nightbot no imprimirá nada)
    res.status(200).end();

    // Enviar mensajes en background (fire-and-forget)
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

// Envía mensajes a Nightbot con delays (fire-and-forget)
async function sendDuelMessagesToNightbot(responseUrl: string, challenger: string, opponent: string) {
    const messages = generateDuelMessages(challenger, opponent);

    for (let i = 0; i < messages.length; i++) {
        // Fire-and-forget: no esperamos respuesta
        sendToNightbotNoWait(responseUrl, messages[i]);

        // Delay reducido a 1 segundo
        if (i < messages.length - 1) {
            await delay(1000);
        }
    }
}

// Envía mensaje sin esperar respuesta (fire-and-forget)
function sendToNightbotNoWait(responseUrl: string, message: string) {
    apiService.sendToNightbot(responseUrl, message)
        .then(() => console.log(`[Nightbot] Mensaje enviado: ${message.substring(0, 30)}...`))
        .catch(err => console.error(`[Nightbot] Error (ignorado): ${err.message}`));
}
