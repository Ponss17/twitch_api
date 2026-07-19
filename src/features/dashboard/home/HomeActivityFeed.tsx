import { useMemo, useState, memo } from 'react';
import { Filter, Radio, Terminal, LayoutGrid, Bot, Wrench, Swords, Activity } from 'lucide-react';

import { panelCard, fadeIn } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import {
    activityEntryKey,
    formatActivityDate,
    getActivityMeta,
    type ActivityLogItem,
    type ActivityLogType
} from '@/features/dashboard/lib/activityLogDisplay';
import {
    ACTIVITY_CATEGORY_LABELS,
    ACTIVITY_TYPES_BY_CATEGORY,
    countActivityByCategory,
    filterActivityLog,
    type ActivityCategoryFilter
} from '@/features/dashboard/lib/activityLogFilter';
import { HomeActivityLogEntry } from '@/features/dashboard/home/HomeActivityLogEntry';
import { ActivityDetailSheet } from '@/features/dashboard/home/ActivityDetailSheet';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

interface HomeActivityFeedProps {
    activity: ActivityLogItem[];
    syncing: boolean;
    syncLabel: string;
    isLoading?: boolean;
    isLive?: boolean;
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
    return (
        <div className="flex flex-col gap-1 py-2" aria-hidden>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 border-b border-white/[0.04] py-2.5"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-white/[0.03]" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div
                            className="h-3.5 animate-pulse rounded bg-white/[0.03]"
                            style={{ width: `${42 + (i % 3) * 10}%` }}
                        />
                        <div
                            className="h-3 animate-pulse rounded bg-white/[0.02]"
                            style={{ width: `${55 + (i % 2) * 15}%` }}
                        />
                    </div>
                    <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-white/[0.03]" />
                </div>
            ))}
        </div>
    );
}

const LOG_DATE_DIVIDER =
    "relative mt-1 py-2 pb-1 text-center text-[0.75rem] uppercase tracking-[1px] text-[#71717a] before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-40px)] before:bg-white/[0.08] before:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-40px)] after:bg-white/[0.08] after:content-['']";

function ActivityEmptyState({ filtered }: { filtered?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className={`mb-1 flex h-11 w-11 items-center justify-center rounded-xl border ${subtleIcon('primary')}`}>
                {filtered ? <Filter className="h-5 w-5" /> : <Terminal className="h-5 w-5" />}
            </div>
            <p className="text-[0.9rem] font-medium text-[#a1a1aa]">
                {filtered ? 'Sin resultados' : 'Sin actividad todavía'}
            </p>
            <p className="max-w-sm text-[0.8rem] leading-relaxed text-[#6b6b73]">
                {filtered
                    ? 'Prueba otro filtro o vuelve a Todos.'
                    : 'Cuando alguien use un comando en tu chat, aparecerá aquí.'}
            </p>
        </div>
    );
}

export const HomeActivityFeed = memo(function HomeActivityFeed({
    activity,
    syncing,
    syncLabel,
    isLoading = false,
    isLive = false,
    highlightKeys,
    title = 'Actividad',
    timeZone
}: HomeActivityFeedProps) {
    const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>('all');
    const [typeFilter, setTypeFilter] = useState<ActivityLogType | 'all'>('all');
    const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);

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

    let lastDateLabel = '';

    return (
        <div className={`group/card ${panelCard} ${fadeIn} flex h-[510px] flex-col`} aria-busy={isLoading}>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <Activity className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-white">{title}</h2>
                        <p className="mt-0.5 text-[0.75rem] text-[#8b8b93]">
                            Filtra por categoría o recurso en tiempo real •{' '}
                            <span
                                className={`font-medium transition-all duration-300 group-hover/card:text-primary group-hover/card:opacity-100 ${syncing ? 'animate-blink-soft text-primary opacity-100' : 'opacity-60'}`}
                            >
                                {syncing ? 'Sincronizando...' : syncLabel}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {isLive ? (
                        <div className="flex items-center gap-1.5">
                            <Radio className="h-3 w-3 text-error" aria-hidden />
                            <span className="animate-blink rounded bg-error px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.1em] text-white">
                                LIVE
                            </span>
                        </div>
                    ) : null}
                    <InfoTooltip
                        placement="bottom"
                        text="Filtra por categoría o recurso. Los eventos nuevos siguen entrando en vivo."
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/[0.04] px-5 py-3">
                {CATEGORY_FILTERS.map((category) => {
                    const count = countActivityByCategory(activity, category);
                    const active = categoryFilter === category;
                    const { icon: Icon } = CATEGORY_META[category];
                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => handleCategoryChange(category)}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.7rem] font-semibold transition-all duration-200 ${active
                                    ? 'bg-primary/15 text-primary ring-1 ring-primary/20 shadow-[0_1px_3px_rgba(145,70,255,0.15)]'
                                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                                }`}
                            aria-pressed={active}
                        >
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/[0.04] bg-transparent text-zinc-400'
                                    }`}
                            >
                                <Icon className="h-2.5 w-2.5" />
                            </span>
                            {ACTIVITY_CATEGORY_LABELS[category]}
                            {!isLoading && count > 0 ? (
                                <span className="text-[0.65rem] opacity-70">{count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {typeOptions.length > 0 ? (
                <div
                    className="flex flex-wrap items-center gap-2 border-b border-white/[0.04] px-5 py-2.5"
                    role="group"
                    aria-label="Filtrar por recurso"
                >
                    <button
                        type="button"
                        onClick={() => setTypeFilter('all')}
                        className={`rounded-md px-2 py-1 text-[0.68rem] font-medium transition-all duration-200 ${typeFilter === 'all'
                                ? 'bg-primary/15 text-primary ring-1 ring-primary/20 shadow-[0_1px_3px_rgba(145,70,255,0.15)]'
                                : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                            }`}
                        aria-pressed={typeFilter === 'all'}
                    >
                        Todos
                    </button>
                    {typeOptions
                        .map((type) => ({ type, meta: getActivityMeta(type) }))
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
                                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.68rem] font-medium transition-all duration-200 ${active
                                            ? 'bg-primary/15 text-primary ring-1 ring-primary/20 shadow-[0_1px_3px_rgba(145,70,255,0.15)]'
                                            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                                        }`}
                                    aria-pressed={active}
                                >
                                    <span
                                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${active ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/[0.04] bg-transparent text-zinc-400'
                                            }`}
                                    >
                                        <TypeIcon className="h-2.5 w-2.5" />
                                    </span>
                                    {meta.label}
                                    {!isLoading && count > 0 ? (
                                        <span className="text-[0.65rem] opacity-70">{count}</span>
                                    ) : null}
                                </button>
                            );
                        })}
                </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-2">
                <div
                    className={`min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-bg-secondary px-3 py-2 [overflow-anchor:none] [scrollbar-color:rgba(145,70,255,0.45)_transparent] [scrollbar-width:thin] ${!isLoading && filteredActivity.length === 0 ? 'flex items-center justify-center' : ''
                        }`}
                >
                    {isLoading ? (
                        <ActivityFeedSkeleton />
                    ) : filteredActivity.length === 0 ? (
                        <ActivityEmptyState filtered={categoryFilter !== 'all' || typeFilter !== 'all'} />
                    ) : (
                        filteredActivity.slice(0, 50).map((item, i) => {
                            const dateLabel = item.timestamp
                                ? formatActivityDate(item.timestamp, timeZone)
                                : '';
                            const showDivider = dateLabel && dateLabel !== lastDateLabel;
                            if (showDivider) lastDateLabel = dateLabel;
                            const key = activityEntryKey(item);
                            const isNew = highlightKeys?.has(key) ?? false;
                            return (
                                <div key={`${key}-${i}`}>
                                    {showDivider ? <div className={LOG_DATE_DIVIDER}>{dateLabel}</div> : null}
                                    <HomeActivityLogEntry 
                                        item={item} 
                                        isNew={isNew} 
                                        timeZone={timeZone} 
                                        onClick={setSelectedActivity}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <ActivityDetailSheet 
                item={selectedActivity} 
                onClose={() => setSelectedActivity(null)} 
                timeZone={timeZone} 
            />
        </div>
    );
});
