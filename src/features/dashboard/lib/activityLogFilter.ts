import {
    DASHBOARD_USAGE_CATEGORIES,
    type DashboardUsageKey
} from '@/features/dashboard/lib/dashboardStats';
import {
    normalizeActivityType,
    type ActivityLogItem,
    type ActivityLogType
} from '@/features/dashboard/lib/activityLogDisplay';

export type ActivityCategoryFilter = 'all' | 'commands' | 'tools' | 'minigames';

const USAGE_TO_ACTIVITY: Record<DashboardUsageKey, ActivityLogType> = {
    clips: 'clip',
    followage: 'followage',
    so: 'shoutout',
    message: 'message',
    stalker: 'stalker',
    trends: 'trends',
    roulette: 'roulette',
    russian: 'russian',
    magic8: 'magic8',
    duel: 'duel'
};

const CATEGORY_ID_TO_FILTER: Record<
    (typeof DASHBOARD_USAGE_CATEGORIES)[number]['id'],
    Exclude<ActivityCategoryFilter, 'all'>
> = {
    'cat-commands': 'commands',
    'cat-tools': 'tools',
    'cat-minigames': 'minigames'
};

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategoryFilter, string> = {
    all: 'Todos',
    commands: DASHBOARD_USAGE_CATEGORIES[0].label,
    tools: DASHBOARD_USAGE_CATEGORIES[1].label,
    minigames: DASHBOARD_USAGE_CATEGORIES[2].label
};

export const ACTIVITY_TYPES_BY_CATEGORY = Object.fromEntries(
    DASHBOARD_USAGE_CATEGORIES.map((cat) => [
        CATEGORY_ID_TO_FILTER[cat.id],
        cat.keys.map((key) => USAGE_TO_ACTIVITY[key])
    ])
) as Record<Exclude<ActivityCategoryFilter, 'all'>, readonly ActivityLogType[]>;

export function matchesActivityCategory(type: string | undefined, category: ActivityCategoryFilter): boolean {
    if (category === 'all') return true;
    const normalized = normalizeActivityType(type);
    return (ACTIVITY_TYPES_BY_CATEGORY[category] as readonly ActivityLogType[]).includes(normalized);
}

export function filterActivityLog(
    activity: ActivityLogItem[],
    category: ActivityCategoryFilter,
    type: ActivityLogType | 'all' = 'all'
): ActivityLogItem[] {
    return activity.filter((item) => {
        const normalized = normalizeActivityType(item.type);
        if (!matchesActivityCategory(item.type, category)) return false;
        if (type !== 'all' && normalized !== type) return false;
        return true;
    });
}

export function countActivityByCategory(
    activity: ActivityLogItem[],
    category: ActivityCategoryFilter
): number {
    return filterActivityLog(activity, category).length;
}
