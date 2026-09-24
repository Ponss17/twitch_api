/** Config de Ruleta Bits en la URL del overlay (mismo patrón que color/scale). */

export type BitsMatchMode = 'exact' | 'min';

export interface BitsRouletteUrlConfig {
    threshold: number;
    matchMode: BitsMatchMode;
    options: string[];
    cooldownSec: number;
    announceChat: boolean;
}

export const DEFAULT_BITS_ROULETTE_URL: BitsRouletteUrlConfig = {
    threshold: 100,
    matchMode: 'exact',
    options: ['Premio 1', 'Premio 2', 'Premio 3'],
    cooldownSec: 45,
    announceChat: false
};

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
            const json = decodeURIComponent(escape(atob(padded)));
            options = normalizePrizeOptions(JSON.parse(json), maxOptions);
        } catch {
            options = normalizePrizeOptions(prizesRaw.split(/[|,]/), maxOptions);
        }
    } else {
        options = normalizePrizeOptions(options, maxOptions);
    }

    const chatRaw = (params.get('chat') || '').toLowerCase();
    const announceChat = chatRaw === '1' || chatRaw === 'true';

    return { threshold, matchMode, options, cooldownSec, announceChat };
}

export function encodePrizesParam(options: string[]): string {
    const cleaned = normalizePrizeOptions(options);
    const json = JSON.stringify(cleaned);
    const b64 = btoa(unescape(encodeURIComponent(json)));
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
