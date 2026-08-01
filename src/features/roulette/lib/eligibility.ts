import type { RouletteUser } from '@/core/types/twitch';
import type { TmiTags } from '@/features/chat/lib/tmiService';

export type RouletteRole = 'subs' | 'mods' | 'vips' | 'viewers';

export interface RouletteEligibilityFilters {
    subs: boolean;
    mods: boolean;
    vips: boolean;
    viewers: boolean;
}

export const DEFAULT_ELIGIBILITY_FILTERS: RouletteEligibilityFilters = {
    subs: true,
    mods: true,
    vips: true,
    viewers: true
};

// eslint-disable-next-line
export const ROULETTE_ROLE_OPTIONS = (rlT: any): { key: RouletteRole; label: string }[] => [
    { key: 'subs', label: rlT.roles.subs },
    { key: 'mods', label: rlT.roles.mods },
    { key: 'vips', label: rlT.roles.vips },
    { key: 'viewers', label: rlT.roles.viewers }
];

function isTruthyTag(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
}

export function isAllFilters(filters: RouletteEligibilityFilters): boolean {
    return filters.subs && filters.mods && filters.vips && filters.viewers;
}

export function hasAnyFilter(filters: RouletteEligibilityFilters): boolean {
    return filters.subs || filters.mods || filters.vips || filters.viewers;
}

export function setAllFilters(enabled: boolean): RouletteEligibilityFilters {
    return { subs: enabled, mods: enabled, vips: enabled, viewers: enabled };
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

export function userMatchesFilters(
    user: Pick<RouletteUser, 'mod' | 'sub' | 'vip'>,
    filters: RouletteEligibilityFilters
): boolean {
    if (isAllFilters(filters)) return true;
    if (!hasAnyFilter(filters)) return false;

    const mod = !!user.mod;
    const sub = !!user.sub;
    const vip = !!user.vip;
    const isViewer = !mod && !sub && !vip;

    if (filters.mods && mod) return true;
    if (filters.subs && sub) return true;
    if (filters.vips && vip) return true;
    if (filters.viewers && isViewer) return true;
    return false;
}

export function tagsMatchFilters(tags: TmiTags, filters: RouletteEligibilityFilters): boolean {
    return userMatchesFilters(rolesFromTags(tags), filters);
}

/** Serializa filtros para GET /dashboard/chatters?eligibility= */
export function filtersToApiParam(filters: RouletteEligibilityFilters): string {
    if (isAllFilters(filters)) return 'all';
    const parts: RouletteRole[] = [];
    if (filters.subs) parts.push('subs');
    if (filters.mods) parts.push('mods');
    if (filters.vips) parts.push('vips');
    if (filters.viewers) parts.push('viewers');
    return parts.length > 0 ? parts.join(',') : 'all';
}

/** Texto del botón del selector de elegibilidad */
// eslint-disable-next-line
export function filtersSummaryLabel(filters: RouletteEligibilityFilters, rlT: any): string {
    if (isAllFilters(filters)) return rlT.all;
    if (!hasAnyFilter(filters)) return rlT.none;
    return ROULETTE_ROLE_OPTIONS(rlT)
        .filter(({ key }) => filters[key])
        .map(({ label }) => label)
        .join(', ');
}
