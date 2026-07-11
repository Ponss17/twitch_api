import { useMemo, useState, memo } from 'react';
import { Filter, Radio, Terminal, LayoutGrid, Bot, Wrench, Swords } from 'lucide-react';

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

const CATEGORY_META: Record<ActivityCategoryFilter, { icon: React.ElementType }> = {
    all:       { icon: LayoutGrid },
    commands:  { icon: Bot },
    tools:     { icon: Wrench },
    minigames: { icon: Swords },
};

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

            <div className="mb-4 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_FILTERS.map((category) => {
                        const count = countActivityByCategory(activity, category);
                        const active = categoryFilter === category;
                        const meta = CATEGORY_META[category];
                        const Icon = meta.icon;
                        
                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => handleCategoryChange(category)}
                                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-all ${
                                    active
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-white/5 bg-white/[0.02] text-[#a1a1aa] hover:border-white/15 hover:bg-white/[0.04] hover:text-[#d4d4d8]'
                                }`}
                                aria-pressed={active}
                            >
                                <Icon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-70'}`} />
                                <span className="text-[0.75rem] font-semibold tracking-wide">
                                    {ACTIVITY_CATEGORY_LABELS[category]}
                                </span>
                                {!isLoading && count > 0 && (
                                    <span className={`ml-0.5 rounded-sm px-1 py-0.5 text-[0.65rem] font-bold ${
                                        active ? 'bg-primary/20 text-current' : 'bg-white/10 text-[#71717a]'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {typeOptions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/15 p-2" role="group" aria-label="Filtrar por recurso">
                        <span className="pl-1 pr-1 text-[0.65rem] font-medium uppercase tracking-widest text-[#71717a]">
                            Sub-filtros
                        </span>
                        <button
                            type="button"
                            onClick={() => setTypeFilter('all')}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.72rem] font-medium transition ${
                                typeFilter === 'all'
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-white/5 bg-white/[0.02] text-[#81818b] hover:border-white/15 hover:text-[#d4d4d8]'
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
                                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.72rem] font-medium transition ${
                                        active
                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                            : 'border-white/5 bg-white/[0.02] text-[#81818b] hover:border-white/15 hover:text-[#d4d4d8]'
                                    }`}
                                    aria-pressed={active}
                                >
                                    <TypeIcon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-70'}`} />
                                    <span>{meta.label}</span>
                                    {!isLoading && count > 0 && (
                                        <span className={`ml-0.5 rounded-sm px-1 py-0.5 text-[0.65rem] font-bold ${
                                            active ? 'bg-primary/20 text-current' : 'bg-white/10 text-[#71717a]'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
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
