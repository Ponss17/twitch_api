import crypto from 'crypto';

export type BitsMatchMode = 'exact' | 'min';

export interface BitsRouletteConfig {
    userId: string;
    enabled: boolean;
    threshold: number;
    matchMode: BitsMatchMode;
    options: string[];
    cooldownSec: number;
    eventsubId: string | null;
    updatedAt?: string;
}

export const DEFAULT_BITS_OPTIONS = ['Premio 1', 'Premio 2', 'Premio 3'];

export function matchesBitsThreshold(
    bits: number,
    threshold: number,
    matchMode: BitsMatchMode
): boolean {
    if (!Number.isFinite(bits) || bits < 1) return false;
    if (matchMode === 'exact') return bits === threshold;
    return bits >= threshold;
}

export function normalizePrizeOptions(raw: unknown): string[] {
    const list = Array.isArray(raw) ? raw : DEFAULT_BITS_OPTIONS;
    const cleaned = list
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0)
        .slice(0, 10);
    return cleaned.length >= 2 ? cleaned : [...DEFAULT_BITS_OPTIONS];
}

/** Twitch pide rechazar mensajes con más de 10 minutos de desfase. */
export const EVENTSUB_MAX_SKEW_MS = 10 * 60 * 1000;

export function isEventSubTimestampFresh(timestamp: string, now = Date.now()): boolean {
    const ms = Date.parse(timestamp);
    if (!Number.isFinite(ms)) return false;
    return Math.abs(now - ms) <= EVENTSUB_MAX_SKEW_MS;
}

export type BitsChatLang = 'es' | 'en' | 'pt';

/** Tope duro del input antes de iterar (CodeQL loop-bound-injection). */
const SCRUB_INPUT_HARD_MAX = 256;

/** Quita controles / saltos sin regex de control chars (eslint no-control-regex). */
function scrubPlainText(raw: string, max: number): string {
    const cap = Math.min(raw.length, Math.max(1, Math.min(max * 4, SCRUB_INPUT_HARD_MAX)));
    let out = '';
    for (let i = 0; i < cap; i++) {
        const code = raw.charCodeAt(i);
        out += code < 32 ? ' ' : raw[i]!;
    }
    return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Texto de chat armado en el servidor. Sin saltos de línea ni comandos. */
export function bitsWinnerChatMessage(
    lang: string | undefined,
    userName: string,
    prize: string,
    bits: number
): string | null {
    const name = scrubPlainText(userName, 25).replace(/^[@/\\.]+/, '');
    const prizeSafe = scrubPlainText(prize, 40).replace(/^[/\\.]+/, '');
    const amount = Math.floor(bits);
    if (!name || !prizeSafe || !Number.isFinite(amount) || amount < 1) return null;
    const code: BitsChatLang = lang === 'en' || lang === 'pt' ? lang : 'es';
    if (code === 'en') return `@${name} won "${prizeSafe}" on the bits wheel (${amount} bits)`;
    if (code === 'pt') return `@${name} ganhou «${prizeSafe}» na roleta de bits (${amount} bits)`;
    return `@${name} ganó «${prizeSafe}» en la ruleta de bits (${amount} bits)`;
}

/** Firma EventSub (sha256 HMAC hex). */
export function verifyEventSubSignature(
    secret: string,
    messageId: string,
    timestamp: string,
    rawBody: Buffer | string,
    signatureHeader: string | undefined
): boolean {
    if (!signatureHeader?.startsWith('sha256=')) return false;
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const message = messageId + timestamp + body;
    const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
    const received = signatureHeader.slice('sha256='.length);
    try {
        const a = Buffer.from(expected, 'hex');
        const b = Buffer.from(received, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}
