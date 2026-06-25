import type { RouletteUser } from '@/lib/twitchTypes';
import type { TmiTags } from '@/lib/tmiService';

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

export const ROULETTE_ROLE_OPTIONS: { key: RouletteRole; label: string }[] = [
    { key: 'subs', label: 'Subs' },
    { key: 'mods', label: 'Mods' },
    { key: 'vips', label: 'VIPs' },
    { key: 'viewers', label: 'Viewers' }
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
export function filtersSummaryLabel(filters: RouletteEligibilityFilters): string {
    if (isAllFilters(filters)) return 'Todos';
    if (!hasAnyFilter(filters)) return 'Ninguno';
    return ROULETTE_ROLE_OPTIONS.filter(({ key }) => filters[key])
        .map(({ label }) => label)
        .join(', ');
}

/** @deprecated Usar userMatchesFilters */
export type RouletteEligibility = 'all' | 'subs' | 'mods' | 'vips';
