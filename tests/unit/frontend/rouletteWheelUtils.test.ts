import { winnerIndex, normalizeDegrees, truncateLabel } from '@/features/tools/roulette/lib/wheelUtils';

describe('rouletteWheelUtils', () => {
    it('normalizeDegrees wraps correctly', () => {
        expect(normalizeDegrees(370)).toBe(10);
        expect(normalizeDegrees(-10)).toBe(350);
    });

    it('winnerIndex returns 0 for single participant', () => {
        expect(winnerIndex(1234, 1)).toBe(0);
    });

    it('winnerIndex stays within participant bounds', () => {
        for (let rotation = 0; rotation < 360; rotation += 15) {
            const index = winnerIndex(rotation, 8);
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(8);
        }
    });

    it('truncateLabel shortens long names', () => {
        expect(truncateLabel('abcdefghijklm', 8)).toBe('abcdefg…');
        expect(truncateLabel('short', 8)).toBe('short');
    });
});
