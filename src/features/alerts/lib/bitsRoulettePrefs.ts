import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { normalizeConfettiSound } from '@/features/alerts/lib/bitsConfettiSound';
import {
    BITS_ROULETTE_PREF,
    DEFAULT_BITS_ROULETTE_URL,
    normalizePrizeOptions,
    normalizeSpinBanner,
    normalizeWinnerHoldSec,
    type BitsRouletteUrlConfig
} from '@/features/alerts/lib/bitsRouletteUrl';

export function readBitsRoulettePrefs(userId?: string, maxOptions?: number): BitsRouletteUrlConfig {
    try {
        const raw = readScopedPref(BITS_ROULETTE_PREF, userId);
        if (!raw) return { ...DEFAULT_BITS_ROULETTE_URL };
        const parsed = JSON.parse(raw) as Partial<BitsRouletteUrlConfig>;
        return {
            threshold: Number(parsed.threshold) || DEFAULT_BITS_ROULETTE_URL.threshold,
            matchMode: parsed.matchMode === 'min' ? 'min' : 'exact',
            options: normalizePrizeOptions(parsed.options, maxOptions),
            cooldownSec: Number(parsed.cooldownSec) || DEFAULT_BITS_ROULETTE_URL.cooldownSec,
            announceChat: parsed.announceChat === true,
            showDonor: parsed.showDonor === true,
            confetti: parsed.confetti === true,
            confettiSound: normalizeConfettiSound(parsed.confettiSound),
            cardStyle: parsed.cardStyle === 'solid' ? 'solid' : 'glass',
            winnerHoldSec: normalizeWinnerHoldSec(parsed.winnerHoldSec),
            spinBanner: normalizeSpinBanner(parsed.spinBanner)
        };
    } catch {
        return { ...DEFAULT_BITS_ROULETTE_URL };
    }
}

export function writeBitsRoulettePrefs(userId: string | undefined, next: BitsRouletteUrlConfig) {
    writeScopedPref(BITS_ROULETTE_PREF, userId, JSON.stringify(next));
}

export function patchBitsRoulettePrefs(
    userId: string | undefined,
    patch: Partial<BitsRouletteUrlConfig>,
    maxOptions?: number
): BitsRouletteUrlConfig {
    const next = { ...readBitsRoulettePrefs(userId, maxOptions), ...patch };
    writeBitsRoulettePrefs(userId, next);
    return next;
}
