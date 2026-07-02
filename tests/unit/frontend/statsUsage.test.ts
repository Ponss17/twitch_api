import { EMPTY_DASHBOARD_LIVE_STATS } from '@/features/dashboard/lib/dashboardStats';
import {
    categoryUsageBreakdown,
    rankResourceUsage,
    RESOURCE_LABELS,
    totalCategoryUsage
} from '@/features/dashboard/lib/statsUsage';

describe('rankResourceUsage', () => {
    it('ordena por uso descendente y omite recursos en cero', () => {
        const rows = rankResourceUsage({
            ...EMPTY_DASHBOARD_LIVE_STATS,
            clips: 3,
            followage: 10,
            stalker: 5,
            trends: 5
        });

        expect(rows.map((r) => r.key)).toEqual(['followage', 'stalker', 'trends', 'clips']);
        expect(rows[0]).toMatchObject({ label: RESOURCE_LABELS.followage, value: 10 });
    });

    it('devuelve array vacío sin uso', () => {
        expect(rankResourceUsage(EMPTY_DASHBOARD_LIVE_STATS)).toEqual([]);
    });
});

describe('categoryUsageBreakdown', () => {
    it('agrupa por categorías del dashboard', () => {
        const slices = categoryUsageBreakdown({
            ...EMPTY_DASHBOARD_LIVE_STATS,
            clips: 2,
            followage: 1,
            so: 1,
            message: 0,
            stalker: 4,
            trends: 3,
            roulette: 2,
            russian: 1,
            magic8: 1,
            duel: 0
        });

        expect(slices).toEqual([
            { id: 'cat-commands', label: 'Comandos', value: 4 },
            { id: 'cat-tools', label: 'Herramientas', value: 9 },
            { id: 'cat-minigames', label: 'Minijuegos', value: 2 }
        ]);
    });

    it('incluye categorías en cero', () => {
        const slices = categoryUsageBreakdown(EMPTY_DASHBOARD_LIVE_STATS);
        expect(slices.every((slice) => slice.value === 0)).toBe(true);
        expect(slices).toHaveLength(3);
    });
});

describe('totalCategoryUsage', () => {
    it('suma los valores de las categorías', () => {
        expect(
            totalCategoryUsage([
                { id: 'a', label: 'A', value: 2 },
                { id: 'b', label: 'B', value: 3 }
            ])
        ).toBe(5);
    });
});
