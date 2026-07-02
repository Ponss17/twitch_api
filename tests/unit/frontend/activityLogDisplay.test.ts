import { describe, expect, it } from '@jest/globals';
import { formatActivityTime } from '@/features/dashboard/lib/activityLogDisplay';

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
