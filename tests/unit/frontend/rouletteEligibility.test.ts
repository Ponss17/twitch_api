import {
    rolesFromTags,
    tagsMatchEligibility,
    userMatchesEligibility
} from '@/lib/rouletteEligibility';

describe('rouletteEligibility', () => {
    it('userMatchesEligibility allows all by default', () => {
        expect(userMatchesEligibility({}, 'all')).toBe(true);
        expect(userMatchesEligibility({ mod: false, sub: false, vip: false }, 'all')).toBe(true);
    });

    it('userMatchesEligibility checks role flags', () => {
        expect(userMatchesEligibility({ sub: true }, 'subs')).toBe(true);
        expect(userMatchesEligibility({ mod: true }, 'mods')).toBe(true);
        expect(userMatchesEligibility({ vip: true }, 'vips')).toBe(true);
        expect(userMatchesEligibility({ sub: true }, 'mods')).toBe(false);
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

    it('tagsMatchEligibility gates chat joiners', () => {
        expect(tagsMatchEligibility({ subscriber: true }, 'subs')).toBe(true);
        expect(tagsMatchEligibility({ vip: true }, 'subs')).toBe(false);
        expect(tagsMatchEligibility({ username: 'x' }, 'all')).toBe(true);
    });
});
