import { useMemo, useState, memo } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Filter, Terminal, LayoutGrid, Bot, Wrench, Swords, Activity } from 'lucide-react';

import { panelCard, fadeIn } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/ui/subtleAccents';
import {
    activityEntryKey,
    formatActivityDate,
    getActivityMeta,
    type ActivityLogItem,
    type ActivityLogType
} from '@/features/dashboard/lib/logs/activityLogDisplay';
import {
    ACTIVITY_TYPES_BY_CATEGORY,
    countActivityByCategory,
    filterActivityLog,
    getActivityCategoryLabels,
    type ActivityCategoryFilter
} from '@/features/dashboard/lib/logs/activityLogFilter';
import { HomeActivityLogEntry } from '@/features/dashboard/home/HomeActivityLogEntry';
import { ActivityDetailSheet } from '@/features/dashboard/home/ActivityDetailSheet';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { SimpleEmptyState } from '@/shared/ui/SimpleEmptyState';
import { ActivityListRowsSkeleton } from '@/shared/ui/skeletons/SectionSkeletons';
import { useTranslation } from '@/core/i18n/I18nContext';

interface HomeActivityFeedProps {
    activity: ActivityLogItem[];
    syncing: boolean;
    syncLabel: string;
    isLoading?: boolean;
    isLive?: boolean;
    /** When Home already shows onboarding, use shorter empty copy in the feed. */
    compactEmpty?: boolean;
    highlightKeys?: ReadonlySet<string>;
    title?: string;
    timeZone?: string;
}

const SKELETON_ROWS = 5;
const CATEGORY_FILTERS: ActivityCategoryFilter[] = ['all', 'commands', 'tools', 'minigames'];
const CATEGORY_META: Record<ActivityCategoryFilter, { icon: React.ElementType }> = {
    all: { icon: LayoutGrid },
    commands: { icon: Bot },
    tools: { icon: Wrench },
    minigames: { icon: Swords }
};

function ActivityFeedSkeleton() {
    return <ActivityListRowsSkeleton rows={SKELETON_ROWS} />;
}

const LOG_DATE_DIVIDER =
    "relative mt-1 py-2 pb-1 text-center text-[0.75rem] uppercase tracking-[1px] text-text-muted before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-60px)] before:bg-border-strong before:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-60px)] after:bg-border-strong after:content-['']";

function ActivityEmptyState({
    filtered,
    compactEmpty
}: {
    filtered?: boolean;
    compactEmpty?: boolean;
}) {
    const { t } = useTranslation();
    const aT = t.home.activityFeed;
    const label = filtered
        ? aT.emptyFiltered
        : compactEmpty
          ? aT.emptyWithOnboarding
          : aT.emptyAll;
    const description = filtered
        ? aT.emptyFilteredDesc
        : compactEmpty
          ? aT.emptyWithOnboardingDesc
          : aT.emptyAllDesc;
    return (
        <SimpleEmptyState
            icon={filtered ? Filter : Terminal}
            label={label}
            description={description}
            className={`h-full min-h-0 w-full flex-1 ${compactEmpty && !filtered ? 'py-6' : 'py-10'}`}
        />
    );
}

export const HomeActivityFeed = memo(function HomeActivityFeed({
    activity,
    syncing,
    syncLabel,
    isLoading = false,
    isLive = false,
    compactEmpty = false,
    highlightKeys,
    title,
    timeZone
}: HomeActivityFeedProps) {
    const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>('all');
    const [typeFilter, setTypeFilter] = useState<ActivityLogType | 'all'>('all');
    const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);
    const { t, locale } = useTranslation();
    const aT = t.home.activityFeed;
    const categoryLabels = getActivityCategoryLabels(t);

    const filteredActivity = useMemo(
        () => filterActivityLog(activity, categoryFilter, typeFilter),
        [activity, categoryFilter, typeFilter]
    );

    const typeOptions =
        categoryFilter === 'all' ? [] : [...ACTIVITY_TYPES_BY_CATEGORY[categoryFilter]];

    const handleCategoryChange = (next: ActivityCategoryFilter) => {
        setCategoryFilter(next);
        setTypeFilter('all');
    };

    const renderItems = useMemo(() => {
        let lastDateLabel = '';
        return filteredActivity.slice(0, 50).map((item) => {
            const dateLabel = item.timestamp
                ? formatActivityDate(item.timestamp, timeZone, locale, t)
                : '';
            const showDivider = dateLabel && dateLabel !== lastDateLabel;
            if (showDivider) lastDateLabel = dateLabel;
            return { item, showDivider, dateLabel, key: activityEntryKey(item) };
        });
    }, [filteredActivity, timeZone, locale, t]);

    return (
        <div className={`group/card ${panelCard} ${fadeIn} flex h-[510px] flex-col`} aria-busy={isLoading}>
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <Activity className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title || aT.title}</h2>
                        <p className="mt-0.5 text-[0.75rem] text-text-muted">
                            {aT.subtitle}{' '}
                            <span
                                className={`font-medium transition-all duration-300 group-hover/card:text-brand-text group-hover/card:opacity-100 ${syncing ? 'animate-pulse text-brand-text opacity-100' : 'opacity-75'}`}
                            >
                                {syncing ? aT.syncing : syncLabel}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {isLive ? (
                        <div className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 text-[0.6875rem] font-semibold tracking-wide text-text-main">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                            <span>{aT.liveBadge}</span>
                        </div>
                    ) : null}
                    <InfoTooltip
                        placement="bottom"
                        text={aT.liveTooltip}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-border-subtle px-5 py-3">
                {CATEGORY_FILTERS.map((category) => {
                    const count = countActivityByCategory(activity, category);
                    const active = categoryFilter === category;
                    const { icon: Icon } = CATEGORY_META[category];
                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => handleCategoryChange(category)}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.7rem] font-semibold transition-colors duration-200 ${active
                                ? 'bg-primary/15 text-brand-text ring-1 ring-primary/25 shadow-sm'
                                : 'text-text-muted hover:bg-white/[0.02] hover:text-text-main'
                                }`}
                            aria-pressed={active}
                        >
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${active ? 'border-primary/30 bg-primary/10 text-brand-text' : 'border-border-subtle bg-transparent text-text-muted'
                                    }`}
                            >
                                <Icon className="h-2.5 w-2.5" />
                            </span>
                            {categoryLabels[category]}
                            {!isLoading && count > 0 ? (
                                <span className="text-[0.65rem] opacity-90">{count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <LazyMotion features={domAnimation}>
                <AnimatePresence initial={false}>
                    {typeOptions.length > 0 ? (
                        <m.div
                            key="type-filters"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden border-b border-border-subtle"
                        >
                            <div
                                className="flex flex-wrap items-center gap-2 px-5 py-2.5"
                                role="group"
                                aria-label={t.common.aria.filterResource}
                            >
                                <button
                                    type="button"
                                    onClick={() => setTypeFilter('all')}
                                    className={`rounded-md px-2 py-1 text-[0.7rem] font-semibold transition-colors duration-200 ${typeFilter === 'all'
                                        ? 'bg-primary/15 text-brand-text ring-1 ring-primary/25 shadow-sm'
                                        : 'text-text-muted hover:bg-white/[0.02] hover:text-text-main'
                                        }`}
                                    aria-pressed={typeFilter === 'all'}
                                >
                                    {aT.all}
                                </button>
                                {typeOptions
                                    .map((type) => ({ type, meta: getActivityMeta(type, t) }))
                                    .sort((a, b) => a.meta.label.localeCompare(b.meta.label))
                                    .map(({ type, meta }) => {
                                        const active = typeFilter === type;
                                        const TypeIcon = meta.icon;
                                        const count = activity.filter((a) => a.type === type).length;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setTypeFilter(type)}
                                                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.7rem] font-semibold transition-colors duration-200 ${active
                                                    ? 'bg-primary/15 text-brand-text ring-1 ring-primary/25 shadow-sm'
                                                    : 'text-text-muted hover:bg-white/[0.02] hover:text-text-main'
                                                    }`}
                                                aria-pressed={active}
                                            >
                                                <span
                                                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${active ? 'border-primary/30 bg-primary/10 text-brand-text' : 'border-border-subtle bg-transparent text-text-muted'
                                                        }`}
                                                >
                                                    <TypeIcon className="h-2.5 w-2.5" />
                                                </span>
                                                {meta.label}
                                                {!isLoading && count > 0 ? (
                                                    <span className="text-[0.65rem] opacity-90">{count}</span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                            </div>
                        </m.div>
                    ) : null}
                </AnimatePresence>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-2">
                    {isLoading ? (
                        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border-strong px-3 py-2 [scrollbar-width:thin]">
                            <ActivityFeedSkeleton />
                        </div>
                    ) : (
                        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border-strong">
                            <AnimatePresence mode="wait" initial={false}>
                                {filteredActivity.length === 0 ? (
                                    <m.div
                                        key={`empty-${categoryFilter}-${typeFilter}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="absolute inset-0 flex flex-col px-3 py-2"
                                    >
                                        <ActivityEmptyState
                                            filtered={categoryFilter !== 'all' || typeFilter !== 'all'}
                                            compactEmpty={compactEmpty}
                                        />
                                    </m.div>
                                ) : (
                                    <m.div
                                        key={`list-${categoryFilter}-${typeFilter}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                        className="absolute inset-0 overflow-y-auto px-3 py-2 [overflow-anchor:none] [scrollbar-width:thin]"
                                    >
                                        <AnimatePresence initial={false}>
                                            {renderItems.map(({ item, showDivider, dateLabel, key }, index) => {
                                                const isNew = highlightKeys?.has(key) ?? false;
                                                const isActive =
                                                    selectedActivity != null &&
                                                    activityEntryKey(selectedActivity) === key;

                                                return (
                                                    <m.div
                                                        key={key}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{
                                                            duration: 0.22,
                                                            ease: 'easeOut',
                                                            delay: Math.min(index, 8) * 0.02
                                                        }}
                                                    >
                                                        {showDivider ? (
                                                            <div className={LOG_DATE_DIVIDER}>{dateLabel}</div>
                                                        ) : null}
                                                        <HomeActivityLogEntry
                                                            item={item}
                                                            isNew={isNew}
                                                            isActive={isActive}
                                                            timeZone={timeZone}
                                                            onClick={setSelectedActivity}
                                                        />
                                                    </m.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </LazyMotion>

            <ActivityDetailSheet
                item={selectedActivity}
                onClose={() => setSelectedActivity(null)}
                timeZone={timeZone}
            />
        </div>
    );
});
