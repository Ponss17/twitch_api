import { useMemo, useState, memo } from 'react';
import { Filter, Radio, Terminal } from 'lucide-react';

import { card, fadeIn } from '@/core/utils/tw';
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
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

interface HomeActivityFeedProps {
    activity: ActivityLogItem[];
    syncing: boolean;
    syncLabel: string;
    isLoading?: boolean;
    isLive?: boolean;
    highlightKeys?: ReadonlySet<string>;
    title?: string;
    subtitle?: string;
}

const SKELETON_ROWS = 5;

const CATEGORY_FILTERS: ActivityCategoryFilter[] = ['all', 'commands', 'tools', 'minigames'];

const FILTER_CHIP = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-[0.72rem] font-medium transition ${
        active
            ? 'border-primary/40 bg-primary/15 text-white'
            : 'border-white/[0.08] bg-white/[0.03] text-[#c4c4cc] hover:border-white/15 hover:text-[#fafafa]'
    }`;

function ActivityFeedSkeleton() {
    return (
        <div className="flex flex-col gap-1 px-1 py-2" aria-hidden>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 border-b border-white/[0.03] py-2.5"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-white/[0.06]" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div
                            className="h-3.5 animate-pulse rounded bg-white/[0.06]"
                            style={{ width: `${42 + (i % 3) * 10}%` }}
                        />
                        <div
                            className="h-3 animate-pulse rounded bg-white/[0.04]"
                            style={{ width: `${55 + (i % 2) * 15}%` }}
                        />
                    </div>
                    <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-white/[0.06]" />
                </div>
            ))}
        </div>
    );
}

const LOG_DATE_DIVIDER =
    "relative mt-1 py-2 pb-1 text-center text-[0.75rem] uppercase tracking-[1px] text-[#71717a] before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-40px)] before:bg-white/[0.08] before:content-[''] after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-40px)] after:bg-white/[0.08] after:content-['']";

function ActivityEmptyState({ filtered }: { filtered?: boolean }) {
    return (
        <div className="flex max-w-xs flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#71717a]">
                {filtered ? <Filter className="h-5 w-5 opacity-60" /> : <Terminal className="h-5 w-5 opacity-60" />}
            </div>
            <div>
                <p className="mb-1 text-[0.95rem] font-semibold text-[#d4d4d8]">
                    {filtered ? 'Sin resultados' : 'Sin actividad todavía'}
                </p>
                <p className="text-[0.82rem] leading-relaxed text-[#71717a]">
                    {filtered
                        ? 'Prueba otro filtro o vuelve a «Todos» para ver todo el historial.'
                        : 'Cuando alguien use un comando en tu chat, aparecerá aquí al instante.'}
                </p>
            </div>
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
    title = 'Historial de Actividad',
    subtitle = 'Filtra por categoría o recurso en tiempo real'
}: HomeActivityFeedProps) {
    const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>('all');
    const [typeFilter, setTypeFilter] = useState<ActivityLogType | 'all'>('all');

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
        <div
            className={`group/card ${card} ${fadeIn} mb-0 flex h-[460px] flex-col`}
            aria-busy={isLoading}
        >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Terminal className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">{title}</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            {subtitle} •{' '}
                            <span
                                className={`ml-1 text-[0.85em] font-medium opacity-60 transition-all duration-300 group-hover/card:opacity-100 group-hover/card:text-primary ${syncing ? 'animate-blink-soft text-primary opacity-100' : ''}`}
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

            <div className="mb-3 space-y-2 rounded-lg border border-white/[0.06] bg-black/15 p-2">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
                    {CATEGORY_FILTERS.map((category) => {
                        const count = countActivityByCategory(activity, category);
                        const active = categoryFilter === category;
                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => handleCategoryChange(category)}
                                className={FILTER_CHIP(active)}
                                aria-pressed={active}
                            >
                                {ACTIVITY_CATEGORY_LABELS[category]}
                                {!isLoading && count > 0 ? (
                                    <span className={`ml-1.5 font-mono text-[0.68rem] ${active ? 'text-white/80' : 'text-[#71717a]'}`}>
                                        {count}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {typeOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por recurso">
                        <button
                            type="button"
                            onClick={() => setTypeFilter('all')}
                            className={FILTER_CHIP(typeFilter === 'all')}
                            aria-pressed={typeFilter === 'all'}
                        >
                            Todos
                        </button>
                        {typeOptions.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTypeFilter(type)}
                                className={FILTER_CHIP(typeFilter === type)}
                                aria-pressed={typeFilter === type}
                            >
                                {getActivityMeta(type).label}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-5 text-[#fafafa]">
                <div
                    className={`block h-full overflow-y-auto [overflow-anchor:none] rounded-xl border border-white/[0.03] bg-black/15 p-4 [scrollbar-color:#9146ff_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar]:w-1 ${
                        !isLoading && filteredActivity.length === 0
                            ? 'flex min-h-[260px] items-center justify-center !p-0'
                            : ''
                    }`}
                >
                    {isLoading ? (
                        <ActivityFeedSkeleton />
                    ) : filteredActivity.length === 0 ? (
                        <ActivityEmptyState filtered={categoryFilter !== 'all' || typeFilter !== 'all'} />
                    ) : (
                        filteredActivity.slice(0, 50).map((item, i) => {
                            const dateLabel = item.timestamp ? formatActivityDate(item.timestamp) : '';
                            const showDivider = dateLabel && dateLabel !== lastDateLabel;
                            if (showDivider) lastDateLabel = dateLabel;
                            const key = activityEntryKey(item);
                            const isNew = highlightKeys?.has(key) ?? false;

                            return (
                                <div key={`${key}-${i}`}>
                                    {showDivider && <div className={LOG_DATE_DIVIDER}>{dateLabel}</div>}
                                    <HomeActivityLogEntry item={item} isNew={isNew} />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
});
