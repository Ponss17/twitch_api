import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { BOT_OPTIONS } from '@/features/commands/lib/commandGenerator';

export const PREFERRED_BOT_PREF = 'preferred_bot';
export const DEFAULT_PREFERRED_BOT = 'nightbot';

const BOT_VALUES = new Set(BOT_OPTIONS.map((b) => b.value));

export function isValidBotId(value: string | null | undefined): value is string {
    return Boolean(value && BOT_VALUES.has(value));
}

export function readPreferredBot(userId?: string): string {
    const stored = readScopedPref(PREFERRED_BOT_PREF, userId);
    return isValidBotId(stored) ? stored : DEFAULT_PREFERRED_BOT;
}

export function writePreferredBot(userId: string | undefined, bot: string): void {
    if (!isValidBotId(bot)) return;
    writeScopedPref(PREFERRED_BOT_PREF, userId, bot);
}
