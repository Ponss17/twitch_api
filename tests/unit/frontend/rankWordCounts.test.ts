import { rankWordCounts } from '@/features/tools/trends/lib/rankWordCounts';

describe('rankWordCounts', () => {
    it('ordena y limita el ranking', () => {
        expect(
            rankWordCounts({
                hola: 2,
                mundo: 5,
                test: 1,
                extra: 99
            })
        ).toEqual({
            ranked: [
                ['extra', 99],
                ['mundo', 5],
                ['hola', 2],
                ['test', 1]
            ],
            maxCount: 99
        });
    });

    it('devuelve maxCount 1 sin datos', () => {
        expect(rankWordCounts({})).toEqual({ ranked: [], maxCount: 1 });
    });
});
