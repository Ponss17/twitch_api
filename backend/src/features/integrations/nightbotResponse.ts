import { waitUntil } from '@vercel/functions';
import { logger } from '../../core/utils/logger';

const NIGHTBOT_MSG_MAX = 400;
const MIN_INTERVAL_SEC = 5;

export const truncateForNightbot = (text: string): string =>
    text.length <= NIGHTBOT_MSG_MAX ? text : `${text.slice(0, NIGHTBOT_MSG_MAX - 1)}…`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Solo HTTPS hacia hosts Nightbot — evita SSRF vía Response-Url. */
export function isAllowedNightbotResponseUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const host = parsed.hostname.toLowerCase();
        return host === 'nightbot.tv' || host.endsWith('.nightbot.tv');
    } catch {
        return false;
    }
}

export const getNightbotResponseUrl = (headers: Record<string, unknown>): string | null => {
    const raw = headers['nightbot-response-url'] ?? headers['Nightbot-Response-Url'];
    const candidate =
        typeof raw === 'string'
            ? raw
            : Array.isArray(raw) && typeof raw[0] === 'string'
              ? raw[0]
              : null;
    if (!candidate || !isAllowedNightbotResponseUrl(candidate)) return null;
    return candidate;
};

/**
 * POST a Nightbot-Response-Url (mismo mecanismo que rokbot/smm.php).
 * Nightbot publica el mensaje como el bot.
 */
export const postNightbotMessage = async (responseUrl: string, message: string): Promise<void> => {
    if (!isAllowedNightbotResponseUrl(responseUrl)) {
        throw new Error('Nightbot Response-Url no permitida');
    }
    const body = new URLSearchParams({ message: truncateForNightbot(message) });
    const res = await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        redirect: 'error'
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Nightbot send ${res.status}: ${text.slice(0, 200)}`);
    }
};

/**
 * Tras devolver el 1.er mensaje en el body del urlfetch, agenda el resto vía Response-Url.
 * No bloquea la respuesta HTTP (usa delays en background).
 */
export const scheduleNightbotFollowUps = (
    responseUrl: string,
    followUps: string[],
    intervalSec: number = MIN_INTERVAL_SEC
): Promise<void> => {
    const intervalMs = Math.max(MIN_INTERVAL_SEC, intervalSec) * 1000;

    const run = async () => {
        for (let i = 0; i < followUps.length; i++) {
            await sleep(intervalMs);
            try {
                await postNightbotMessage(responseUrl, followUps[i]);
                logger.info(`Nightbot follow-up #${i + 2} enviado`);
            } catch (err) {
                logger.error(`Error enviando mensaje Nightbot #${i + 2}:`, err);
            }
        }
    };

    return run();
};

/**
 * Mantiene viva la función en Vercel tras responder.
 * waitUntil debe registrarse de forma síncrona ANTES de res.send.
 */
export const keepAliveAfterResponse = (work: Promise<unknown>): void => {
    try {
        waitUntil(work);
    } catch {
        void work;
    }
};
