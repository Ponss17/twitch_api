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

// Envía mensajes a Nightbot con delays de 5s (rate limit)
async function sendDuelMessagesToNightbot(responseUrl: string, challenger: string, opponent: string) {
    const messages = generateDuelMessages(challenger, opponent);

    for (let i = 0; i < messages.length; i++) {
        try {
            console.log(`[Nightbot] Enviando mensaje ${i + 1}/${messages.length}`);
            await apiService.sendToNightbot(responseUrl, messages[i]);
            console.log(`[Nightbot] Mensaje ${i + 1} enviado exitosamente`);

            // Esperar 5 segundos antes del siguiente (rate limit de Nightbot)
            if (i < messages.length - 1) {
                await delay(5000);
            }
        } catch (error: any) {
            console.error(`[Nightbot] Error en mensaje ${i + 1}:`, error.message);
            // Si es rate limit, esperar y reintentar
            if (error.response?.status === 429) {
                console.log(`[Nightbot] Rate limit alcanzado, esperando 5s...`);
                await delay(5000);
                i--; // Reintentar este mensaje
            } else {
                break; // Otro error, detener
            }
        }
    }
}
