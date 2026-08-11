import { describe, expect, it } from '@jest/globals';
import {
    formatActivityTime,
    mergeActivityLogs,
    type ActivityLogItem
} from '@/features/dashboard/lib/activityLogDisplay';

describe('formatActivityTime', () => {
    it('uses 12-hour clock with am/pm', () => {
        const morning = new Date(2026, 0, 15, 9, 7);
        const afternoon = new Date(2026, 0, 15, 14, 30);
        const midnight = new Date(2026, 0, 15, 0, 0);
        const noon = new Date(2026, 0, 15, 12, 0);

        expect(formatActivityTime(morning.toISOString())).toBe('9:07 am');
        expect(formatActivityTime(afternoon.toISOString())).toBe('2:30 pm');
        expect(formatActivityTime(midnight.toISOString())).toBe('12:00 am');
        expect(formatActivityTime(noon.toISOString())).toBe('12:00 pm');
    });

    it('returns empty string for invalid timestamps', () => {
        expect(formatActivityTime('invalid')).toBe('');
    });
});

describe('mergeActivityLogs', () => {
    const item = (timestamp: string, type: string, user: string): ActivityLogItem => ({
        timestamp,
        type,
        user,
        metadata: {}
    });
    const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

    it('keeps realtime-only rows newer than the fetch snapshot', () => {
        const older = item(iso(30_000), 'clip', 'a');
        const newer = item(iso(5_000), 'slots', 'b');
        const merged = mergeActivityLogs([older], [newer, older]);
        expect(merged).toHaveLength(2);
        expect(merged[0]?.user).toBe('b');
        expect(merged[1]?.user).toBe('a');
    });

    it('drops local rows missing from the fetch and older than it', () => {
        const fetched = item(iso(10_000), 'clip', 'a');
        const deleted = item(iso(600_000), 'slots', 'b');
        const merged = mergeActivityLogs([fetched], [deleted, fetched]);
        expect(merged).toHaveLength(1);
        expect(merged[0]?.user).toBe('a');
    });

    it('drops stale local rows when the fetch comes back empty', () => {
        const old = item(iso(600_000), 'clip', 'a');
        expect(mergeActivityLogs([], [old])).toHaveLength(0);
    });

    it('dedupes by activity key', () => {
        const row = item(iso(10_000), 'clip', 'a');
        expect(mergeActivityLogs([row], [row])).toHaveLength(1);
    });
});
