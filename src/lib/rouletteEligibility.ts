import type { RouletteUser } from '@/lib/twitchTypes';
import type { TmiTags } from '@/lib/tmiService';

export type RouletteEligibility = 'all' | 'subs' | 'mods' | 'vips';

export const ROULETTE_ELIGIBILITY_OPTIONS: { value: RouletteEligibility; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'subs', label: 'Solo Subs' },
    { value: 'mods', label: 'Solo Mods' },
    { value: 'vips', label: 'Solo VIPs' }
];

function isTruthyTag(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
}

export function rolesFromTags(tags: TmiTags): Pick<RouletteUser, 'mod' | 'sub' | 'vip'> {
    const badges = tags.badges;
    const badgeMap =
        badges && typeof badges === 'object' && !Array.isArray(badges)
            ? (badges as Record<string, string>)
            : {};

    return {
        mod: isTruthyTag(tags.mod) || 'moderator' in badgeMap,
        sub: isTruthyTag(tags.subscriber) || 'subscriber' in badgeMap,
        vip: isTruthyTag(tags.vip) || 'vip' in badgeMap
    };
}

export function userMatchesEligibility(
    user: Pick<RouletteUser, 'mod' | 'sub' | 'vip'>,
    eligibility: RouletteEligibility
): boolean {
    if (eligibility === 'all') return true;
    if (eligibility === 'mods') return !!user.mod;
    if (eligibility === 'subs') return !!user.sub;
    if (eligibility === 'vips') return !!user.vip;
    return true;
}

export function tagsMatchEligibility(tags: TmiTags, eligibility: RouletteEligibility): boolean {
    return userMatchesEligibility(rolesFromTags(tags), eligibility);
}

export function rolesForEligibility(
    eligibility: RouletteEligibility
): Pick<RouletteUser, 'mod' | 'sub' | 'vip'> {
    if (eligibility === 'mods') return { mod: true };
    if (eligibility === 'subs') return { sub: true };
    if (eligibility === 'vips') return { vip: true };
    return {};
}
