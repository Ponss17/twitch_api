/** Config de Ruleta Bits en la URL del overlay (mismo patrón que color/scale). */

import {
    normalizeConfettiSound,
    type BitsConfettiSoundId
} from '@/features/alerts/lib/bitsConfettiSound';

export type BitsMatchMode = 'exact' | 'min';
export type BitsWinnerCardStyle = 'glass' | 'solid';
export type { BitsConfettiSoundId };

export interface BitsRouletteUrlConfig {
    threshold: number;
    matchMode: BitsMatchMode;
    options: string[];
    cooldownSec: number;
    announceChat: boolean;
    showDonor: boolean;
    confetti: boolean;
    /** Sonido al revelar ganador (con o sin confeti visual). */
    confettiSound: BitsConfettiSoundId;
    cardStyle: BitsWinnerCardStyle;
    /** Segundos que la tarjeta del ganador se queda en OBS (3–15). */
    winnerHoldSec: number;
    /** Texto encima de la ruleta mientras gira. Vacío = oculto. Placeholders: {name} {bits} */
    spinBanner: string;
}

export const DEFAULT_BITS_ROULETTE_URL: BitsRouletteUrlConfig = {
    threshold: 100,
    matchMode: 'exact',
    options: ['Premio 1', 'Premio 2', 'Premio 3'],
    cooldownSec: 45,
    announceChat: false,
    showDonor: false,
    confetti: false,
    confettiSound: 'none',
    cardStyle: 'glass',
    winnerHoldSec: 10,
    spinBanner: ''
};

export const BITS_WINNER_HOLD_MIN_SEC = 3;
export const BITS_WINNER_HOLD_MAX_SEC = 15;

export function normalizeWinnerHoldSec(raw: unknown): number {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return DEFAULT_BITS_ROULETTE_URL.winnerHoldSec;
    return Math.min(BITS_WINNER_HOLD_MAX_SEC, Math.max(BITS_WINNER_HOLD_MIN_SEC, n));
}

export const DEFAULT_BITS_SPIN_BANNER = '{name} giró la ruleta con {bits} bits';
export const BITS_SPIN_BANNER_MAX = 80;

export const BITS_ROULETTE_PREF = 'bits_roulette_url_config';

/** Techo absoluto (Partner). El panel corta antes según plan. */
export const BITS_ROULETTE_OPTIONS_HARD_MAX = 10;
export const BITS_ROULETTE_OPTIONS_MIN = 2;

/** Fallback FE si el perfil aún no cargó — alineado con USER_ROLES. */
export const BITS_ROULETTE_OPTIONS_BY_ROLE: Record<string, number> = {
    default: 4,
    pro: 5,
    vip: 8,
    partner: 10
};

export function maxBitsRouletteOptionsForRole(role?: string | null): number {
    const key = (role || 'default').toLowerCase();
    return BITS_ROULETTE_OPTIONS_BY_ROLE[key] ?? BITS_ROULETTE_OPTIONS_BY_ROLE.default;
}

export function normalizePrizeOptions(raw: unknown, max = BITS_ROULETTE_OPTIONS_HARD_MAX): string[] {
    const cap = Math.min(
        BITS_ROULETTE_OPTIONS_HARD_MAX,
        Math.max(BITS_ROULETTE_OPTIONS_MIN, Math.floor(max) || BITS_ROULETTE_OPTIONS_HARD_MAX)
    );
    const list = Array.isArray(raw) ? raw : DEFAULT_BITS_ROULETTE_URL.options;
    const cleaned = list
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0)
        .slice(0, cap);
    return cleaned.length >= BITS_ROULETTE_OPTIONS_MIN
        ? cleaned
        : [...DEFAULT_BITS_ROULETTE_URL.options];
}

/** Un cheer más viejo que esto no debe girar (replay al recargar OBS). */
export const BITS_CHEER_MAX_AGE_MS = 3 * 60 * 1000;

export function isCheerFresh(at: number | undefined, now = Date.now()): boolean {
    if (typeof at !== 'number' || !Number.isFinite(at)) return false;
    const age = now - at;
    return age >= -2 * 60 * 1000 && age <= BITS_CHEER_MAX_AGE_MS;
}

function parseFlag(raw: string | null): boolean {
    const v = (raw || '').toLowerCase();
    return v === '1' || v === 'true';
}

export function normalizeSpinBanner(raw: unknown): string {
    const text = String(raw ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, BITS_SPIN_BANNER_MAX);
    return text;
}

export type SpinBannerPart =
    | { type: 'text'; value: string }
    | { type: 'var'; key: 'name' | 'bits'; value: string };

export function parseSpinBannerParts(
    template: string,
    name: string,
    bits: number
): SpinBannerPart[] {
    const safeName = (name || '').trim().slice(0, 25) || '???';
    const safeBits = Number.isFinite(bits) && bits > 0 ? String(Math.floor(bits)) : '?';
    const tpl = normalizeSpinBanner(template);
    const parts: SpinBannerPart[] = [];
    const re = /\{(name|bits)\}/gi;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(tpl)) !== null) {
        if (match.index > last) {
            parts.push({ type: 'text', value: tpl.slice(last, match.index) });
        }
        const key = match[1].toLowerCase() as 'name' | 'bits';
        parts.push({
            type: 'var',
            key,
            value: key === 'name' ? safeName : safeBits,
        });
        last = match.index + match[0].length;
    }
    if (last < tpl.length) {
        parts.push({ type: 'text', value: tpl.slice(last) });
    }
    if (parts.length === 0) {
        parts.push({ type: 'text', value: tpl });
    }
    return parts;
}

export function formatSpinBanner(
    template: string,
    name: string,
    bits: number
): string {
    return parseSpinBannerParts(template, name, bits)
        .map((part) => part.value)
        .join('');
}

function utf8ToBase64(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function base64ToUtf8(b64: string): string {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function encodeBannerParam(text: string): string {
    const cleaned = normalizeSpinBanner(text);
    const b64 = utf8ToBase64(cleaned);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBannerParam(raw: string | null): string {
    if (!raw) return '';
    try {
        const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
        return normalizeSpinBanner(base64ToUtf8(padded));
    } catch {
        return normalizeSpinBanner(raw);
    }
}

export function parseBitsRouletteUrlConfig(
    search = '',
    maxOptions = BITS_ROULETTE_OPTIONS_HARD_MAX
): BitsRouletteUrlConfig {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const threshold = Math.min(
        100_000,
        Math.max(
            1,
            Number(params.get('bits') || params.get('threshold')) ||
                DEFAULT_BITS_ROULETTE_URL.threshold
        )
    );
    const matchRaw = (params.get('match') || 'exact').toLowerCase();
    const matchMode: BitsMatchMode = matchRaw === 'min' ? 'min' : 'exact';
    const cooldownSec = Math.min(
        3600,
        Math.max(5, Number(params.get('cooldown')) || DEFAULT_BITS_ROULETTE_URL.cooldownSec)
    );

    let options = [...DEFAULT_BITS_ROULETTE_URL.options];
    const prizesRaw = params.get('prizes') || params.get('options');
    if (prizesRaw) {
        try {
            const padded = prizesRaw.replace(/-/g, '+').replace(/_/g, '/');
            const json = base64ToUtf8(padded);
            options = normalizePrizeOptions(JSON.parse(json), maxOptions);
        } catch {
            options = normalizePrizeOptions(prizesRaw.split(/[|,]/), maxOptions);
        }
    } else {
        options = normalizePrizeOptions(options, maxOptions);
    }

    const cardRaw = (params.get('card') || '').toLowerCase();
    const cardStyle: BitsWinnerCardStyle = cardRaw === 'solid' ? 'solid' : 'glass';

    return {
        threshold,
        matchMode,
        options,
        cooldownSec,
        announceChat: parseFlag(params.get('chat')),
        showDonor: parseFlag(params.get('donor')),
        confetti: parseFlag(params.get('confetti')),
        confettiSound: normalizeConfettiSound(params.get('sound')),
        cardStyle,
        winnerHoldSec: normalizeWinnerHoldSec(
            params.get('hold') || DEFAULT_BITS_ROULETTE_URL.winnerHoldSec
        ),
        spinBanner: decodeBannerParam(params.get('banner'))
    };
}

export function encodePrizesParam(options: string[]): string {
    const cleaned = normalizePrizeOptions(options);
    const json = JSON.stringify(cleaned);
    const b64 = utf8ToBase64(json);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Añade bits/match/prizes/cooldown a la URL copiable del overlay. */
export function appendBitsRouletteParams(
    rawUrl: string,
    config: BitsRouletteUrlConfig
): string {
    if (!rawUrl) return '';
    try {
        const urlObj = new URL(
            rawUrl,
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        );
        urlObj.searchParams.set('bits', String(config.threshold));
        urlObj.searchParams.set('match', config.matchMode);
        urlObj.searchParams.set('prizes', encodePrizesParam(config.options));
        if (config.cooldownSec !== DEFAULT_BITS_ROULETTE_URL.cooldownSec) {
            urlObj.searchParams.set('cooldown', String(config.cooldownSec));
        } else {
            urlObj.searchParams.delete('cooldown');
        }
        if (config.announceChat) urlObj.searchParams.set('chat', '1');
        else urlObj.searchParams.delete('chat');
        if (config.showDonor) urlObj.searchParams.set('donor', '1');
        else urlObj.searchParams.delete('donor');
        if (config.confetti) urlObj.searchParams.set('confetti', '1');
        else urlObj.searchParams.delete('confetti');
        const sound = normalizeConfettiSound(config.confettiSound);
        if (sound !== 'none') urlObj.searchParams.set('sound', sound);
        else urlObj.searchParams.delete('sound');
        if (config.cardStyle === 'solid') urlObj.searchParams.set('card', 'solid');
        else urlObj.searchParams.delete('card');
        const hold = normalizeWinnerHoldSec(config.winnerHoldSec);
        if (hold !== DEFAULT_BITS_ROULETTE_URL.winnerHoldSec) {
            urlObj.searchParams.set('hold', String(hold));
        } else {
            urlObj.searchParams.delete('hold');
        }
        const banner = normalizeSpinBanner(config.spinBanner);
        if (banner) urlObj.searchParams.set('banner', encodeBannerParam(banner));
        else urlObj.searchParams.delete('banner');
        return urlObj.toString();
    } catch {
        return rawUrl;
    }
}

export function matchesBitsThreshold(
    bits: number,
    threshold: number,
    matchMode: BitsMatchMode
): boolean {
    if (!Number.isFinite(bits) || bits < 1) return false;
    if (matchMode === 'exact') return bits === threshold;
    return bits >= threshold;
}
