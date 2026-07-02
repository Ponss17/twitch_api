import { describe, expect, it } from '@jest/globals';
import {
    ACTIVITY_TYPES_BY_CATEGORY,
    countActivityByCategory,
    filterActivityLog,
    matchesActivityCategory
} from '@/features/dashboard/lib/activityLogFilter';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';

const SAMPLE: ActivityLogItem[] = [
    { type: 'clip', user: 'user1', timestamp: '2026-01-01T10:00:00Z' },
    { type: 'trends', user: 'user2', timestamp: '2026-01-01T11:00:00Z' },
    { type: 'duel', user: 'user3', timestamp: '2026-01-01T12:00:00Z' },
    { type: 'unknown', user: 'user4', timestamp: '2026-01-01T13:00:00Z' }
];

describe('activityLogFilter', () => {
    it('filters by category', () => {
        expect(filterActivityLog(SAMPLE, 'commands')).toHaveLength(1);
        expect(filterActivityLog(SAMPLE, 'tools')).toHaveLength(1);
        expect(filterActivityLog(SAMPLE, 'all')).toHaveLength(4);
    });

    it('filters by category and type', () => {
        const items: ActivityLogItem[] = [
            { type: 'clip', timestamp: '1' },
            { type: 'followage', timestamp: '2' }
        ];
        expect(filterActivityLog(items, 'commands', 'clip')).toHaveLength(1);
        expect(filterActivityLog(items, 'commands', 'all')).toHaveLength(2);
    });

    it('counts activity per category', () => {
        expect(countActivityByCategory(SAMPLE, 'minigames')).toBe(1);
        expect(countActivityByCategory(SAMPLE, 'all')).toBe(4);
    });

    it('matches category membership', () => {
        expect(matchesActivityCategory('roulette', 'tools')).toBe(true);
        expect(matchesActivityCategory('clip', 'tools')).toBe(false);
        expect(matchesActivityCategory('clip', 'all')).toBe(true);
    });

    it('covers every known category type list', () => {
        expect(ACTIVITY_TYPES_BY_CATEGORY.commands).toContain('shoutout');
        expect(ACTIVITY_TYPES_BY_CATEGORY.tools).toHaveLength(3);
        expect(ACTIVITY_TYPES_BY_CATEGORY.minigames).toContain('magic8');
    });
});
