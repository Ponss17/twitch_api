import type { RouletteUser } from '@/core/types/twitch';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';

export type RouletteEntryMode = 'presence' | 'keyword';

export interface RouletteWinnerHistoryEntry {
    user_login: string;
    user_name: string;
    at: number;
    count: number;
}

const ENTRY_MODE_PREF = 'roulette_entry_mode';
const KEYWORD_PREF = 'roulette_entry_keyword';
const HISTORY_PREF = 'roulette_winner_history';
const HISTORY_CAP = 20;

export function readEntryModePref(userId?: string): RouletteEntryMode {
    const stored = readScopedPref(ENTRY_MODE_PREF, userId);
    return stored === 'keyword' ? 'keyword' : 'presence';
}

export function writeEntryModePref(userId: string | undefined, mode: RouletteEntryMode): void {
    writeScopedPref(ENTRY_MODE_PREF, userId, mode);
}

export function readKeywordPref(userId?: string): string {
    const stored = readScopedPref(KEYWORD_PREF, userId);
    return stored || 'sorteo';
}

export function writeKeywordPref(userId: string | undefined, keyword: string): void {
    writeScopedPref(KEYWORD_PREF, userId, keyword.replace(/^!+/, '') || 'sorteo');
}

export function readWinnerHistory(userId?: string): RouletteWinnerHistoryEntry[] {
    const raw = readScopedPref(HISTORY_PREF, userId);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (e): e is RouletteWinnerHistoryEntry =>
                !!e &&
                typeof e === 'object' &&
                typeof (e as RouletteWinnerHistoryEntry).user_login === 'string' &&
                typeof (e as RouletteWinnerHistoryEntry).user_name === 'string' &&
                typeof (e as RouletteWinnerHistoryEntry).at === 'number'
        );
    } catch {
        return [];
    }
}

export function appendWinnerHistory(
    userId: string | undefined,
    winner: RouletteUser,
    count: number
): RouletteWinnerHistoryEntry[] {
    const entry: RouletteWinnerHistoryEntry = {
        user_login: winner.user_login,
        user_name: winner.user_name,
        at: Date.now(),
        count
    };
    const next = [entry, ...readWinnerHistory(userId)].slice(0, HISTORY_CAP);
    writeScopedPref(HISTORY_PREF, userId, JSON.stringify(next));
    return next;
}

export function clearWinnerHistory(userId: string | undefined): void {
    writeScopedPref(HISTORY_PREF, userId, '[]');
}
