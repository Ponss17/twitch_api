import {
    DASHBOARD_USAGE_CATEGORIES,
    DASHBOARD_USAGE_KEYS,
    type DashboardLiveStats,
    type DashboardUsageKey
} from '@/features/dashboard/lib/dashboardStats';

export const RESOURCE_LABELS: Record<DashboardUsageKey, string> = {
    clips: 'Clips',
    followage: 'Followage',
    so: 'Shoutout',
    message: 'Mensaje',
    stalker: 'Stalker',
    trends: 'Tendencias',
    roulette: 'Ruleta',
    russian: 'Ruleta rusa',
    magic8: 'Bola 8',
    duel: 'Duelo'
};

export interface RankedResourceUsage {
    key: DashboardUsageKey;
    label: string;
    value: number;
}

export interface CategoryUsageSlice {
    id: string;
    label: string;
    value: number;
}

export function rankResourceUsage(stats: DashboardLiveStats): RankedResourceUsage[] {
    return DASHBOARD_USAGE_KEYS.map((key) => ({
        key,
        label: RESOURCE_LABELS[key],
        value: stats[key] ?? 0
    }))
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value);
}

export function categoryUsageBreakdown(stats: DashboardLiveStats): CategoryUsageSlice[] {
    return DASHBOARD_USAGE_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        value: cat.keys.reduce((sum, key) => sum + (stats[key] ?? 0), 0)
    }));
}

export function totalCategoryUsage(slices: CategoryUsageSlice[]): number {
    return slices.reduce((sum, slice) => sum + slice.value, 0);
}
