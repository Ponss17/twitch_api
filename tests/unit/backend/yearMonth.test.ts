import {
    formatYearMonth,
    getPreviousYearMonth,
    getYearMonthBounds,
    isValidYearMonth,
    shiftYearMonth
} from '@/core/utils/yearMonth';

describe('yearMonth utils', () => {
    it('valida YYYY-MM', () => {
        expect(isValidYearMonth('2026-08')).toBe(true);
        expect(isValidYearMonth('2026-13')).toBe(false);
        expect(isValidYearMonth('26-08')).toBe(false);
    });

    it('calcula bounds inclusivos del mes', () => {
        expect(getYearMonthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
        expect(getYearMonthBounds('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
        expect(getYearMonthBounds('2026-08')).toEqual({ start: '2026-08-01', end: '2026-08-31' });
    });

    it('shiftYearMonth cruza años', () => {
        expect(shiftYearMonth('2026-01', -1)).toBe('2025-12');
        expect(shiftYearMonth('2025-12', 1)).toBe('2026-01');
        expect(formatYearMonth(2026, 9)).toBe('2026-09');
    });

    it('getPreviousYearMonth respeta TZ (America/Mexico_City)', () => {
        const lateAugMexico = new Date('2026-09-01T05:00:00.000Z');
        expect(getPreviousYearMonth('America/Mexico_City', lateAugMexico)).toBe('2026-07');

        const septMexico = new Date('2026-09-01T12:00:00.000Z');
        expect(getPreviousYearMonth('America/Mexico_City', septMexico)).toBe('2026-08');
    });
});
