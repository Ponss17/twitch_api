import {
    DEFAULT_ELIGIBILITY_FILTERS,
    filtersToApiParam,
    filtersSummaryLabel,
    isAllFilters,
    rolesFromTags,
    setAllFilters,
    tagsMatchFilters,
    userMatchesFilters
} from '@/features/roulette/lib/eligibility';

describe('rouletteEligibility', () => {
    it('userMatchesFilters allows all when every role is enabled', () => {
        expect(userMatchesFilters({}, DEFAULT_ELIGIBILITY_FILTERS)).toBe(true);
        expect(userMatchesFilters({ mod: false, sub: false, vip: false }, DEFAULT_ELIGIBILITY_FILTERS)).toBe(
            true
        );
    });

    it('userMatchesFilters uses OR between selected roles', () => {
        const subsAndMods = { subs: true, mods: true, vips: false, viewers: false };
        expect(userMatchesFilters({ sub: true }, subsAndMods)).toBe(true);
        expect(userMatchesFilters({ mod: true }, subsAndMods)).toBe(true);
        expect(userMatchesFilters({ vip: true }, subsAndMods)).toBe(false);
        expect(userMatchesFilters({}, subsAndMods)).toBe(false);
    });

    it('userMatchesFilters includes plain viewers when enabled', () => {
        const viewersOnly = { subs: false, mods: false, vips: false, viewers: true };
        expect(userMatchesFilters({}, viewersOnly)).toBe(true);
        expect(userMatchesFilters({ sub: true }, viewersOnly)).toBe(false);
    });

    it('isAllFilters and setAllFilters stay in sync', () => {
        expect(isAllFilters(setAllFilters(true))).toBe(true);
        expect(isAllFilters(setAllFilters(false))).toBe(false);
    });

    it('filtersToApiParam serializes multi-select', () => {
        expect(filtersToApiParam(DEFAULT_ELIGIBILITY_FILTERS)).toBe('all');
        expect(
            filtersToApiParam({ subs: true, mods: true, vips: false, viewers: false })
        ).toBe('subs,mods');
    });

    it('filtersSummaryLabel describes selection for the dropdown', () => {
        expect(filtersSummaryLabel(DEFAULT_ELIGIBILITY_FILTERS)).toBe('Todos');
        expect(filtersSummaryLabel({ subs: false, mods: false, vips: false, viewers: false })).toBe(
            'Ninguno'
        );
        expect(
            filtersSummaryLabel({ subs: true, mods: true, vips: false, viewers: false })
        ).toBe('Subs, Mods');
    });

    it('rolesFromTags reads tmi flags and badges', () => {
        expect(
            rolesFromTags({
                mod: true,
                subscriber: '1',
                badges: { vip: '1' }
            })
        ).toEqual({ mod: true, sub: true, vip: true });
    });

    it('tagsMatchFilters gates chat joiners', () => {
        expect(tagsMatchFilters({ subscriber: true }, { subs: true, mods: false, vips: false, viewers: false })).toBe(
            true
        );
        expect(tagsMatchFilters({ vip: true }, { subs: true, mods: false, vips: false, viewers: false })).toBe(
            false
        );
        expect(tagsMatchFilters({ username: 'x' }, DEFAULT_ELIGIBILITY_FILTERS)).toBe(true);
    });
});
