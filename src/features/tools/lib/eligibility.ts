import type { RouletteUser } from '@/core/types/twitch';
import type { TmiTags } from '@/features/chat/lib/tmiService';

export type EligibilityRole = 'subs' | 'mods' | 'vips' | 'viewers';
/** @deprecated Usar EligibilityRole */
export type RouletteRole = EligibilityRole;

export interface EligibilityFilters {
    subs: boolean;
    mods: boolean;
    vips: boolean;
    viewers: boolean;
}
/** @deprecated Usar EligibilityFilters */
export type RouletteEligibilityFilters = EligibilityFilters;

export const DEFAULT_ELIGIBILITY_FILTERS: EligibilityFilters = {
    subs: true,
    mods: true,
    vips: true,
    viewers: true
};

// eslint-disable-next-line
export const ROLE_OPTIONS = (rlT: any): { key: EligibilityRole; label: string }[] => [
    { key: 'subs', label: rlT.roles.subs },
    { key: 'mods', label: rlT.roles.mods },
    { key: 'vips', label: rlT.roles.vips },
    { key: 'viewers', label: rlT.roles.viewers }
];

/** @deprecated Usar ROLE_OPTIONS */
export const ROULETTE_ROLE_OPTIONS = ROLE_OPTIONS;

function isTruthyTag(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
}

export function isAllFilters(filters: EligibilityFilters): boolean {
    return filters.subs && filters.mods && filters.vips && filters.viewers;
}

export function hasAnyFilter(filters: EligibilityFilters): boolean {
    return filters.subs || filters.mods || filters.vips || filters.viewers;
}

export function setAllFilters(enabled: boolean): EligibilityFilters {
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
    filters: EligibilityFilters
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

export function tagsMatchFilters(tags: TmiTags, filters: EligibilityFilters): boolean {
    return userMatchesFilters(rolesFromTags(tags), filters);
}

/** Serializa filtros para GET /dashboard/chatters?eligibility= */
export function filtersToApiParam(filters: EligibilityFilters): string {
    if (isAllFilters(filters)) return 'all';
    const parts: EligibilityRole[] = [];
    if (filters.subs) parts.push('subs');
    if (filters.mods) parts.push('mods');
    if (filters.vips) parts.push('vips');
    if (filters.viewers) parts.push('viewers');
    return parts.length > 0 ? parts.join(',') : 'all';
}

/** Texto del botón del selector de elegibilidad */
// eslint-disable-next-line
export function filtersSummaryLabel(filters: EligibilityFilters, rlT: any): string {
    if (isAllFilters(filters)) return rlT.all;
    if (!hasAnyFilter(filters)) return rlT.none;
    return ROLE_OPTIONS(rlT)
        .filter(({ key }) => filters[key])
        .map(({ label }) => label)
        .join(', ');
}
