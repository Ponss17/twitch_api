import { Gamepad2, Terminal, TrendingUp, Wrench } from 'lucide-react';

import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import {
    DASHBOARD_USAGE_CATEGORIES,
    sumDashboardCategoryUsage,
    type DashboardLiveStats
} from '@/features/dashboard/lib/dashboardStats';
import { StatsSectionCard } from '@/features/dashboard/components/stats/StatsSectionCard';
import { StatsSyncBadge } from '@/features/dashboard/components/stats/statsUi';

const CATEGORY_ICONS = {
    'cat-commands': Terminal,
    'cat-tools': Wrench,
    'cat-minigames': Gamepad2
} as const;

const CATEGORY_TILE =
    'relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/25 p-3.5 pl-4 backdrop-blur-[10px] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-60';

interface StatsSummarySectionProps {
    stats: DashboardLiveStats;
    loading: boolean;
    syncing: boolean;
    syncLabel: string;
}

export function StatsSummarySection({ stats, loading, syncing, syncLabel }: StatsSummarySectionProps) {
    const total = sumDashboardCategoryUsage(stats);

    return (
        <StatsSectionCard
            icon={TrendingUp}
            title="Resumen del día"
            subtitle="Contadores de uso por categoría desde medianoche local"
            info="Cada vez que alguien usa un comando, herramienta o minijuego en tu chat, se suma aquí. Los datos se reinician a medianoche en tu zona horaria."
            delay={0}
            headerExtra={<StatsSyncBadge syncing={syncing} label={syncLabel} />}
        >
            <div className="mb-4 flex items-end gap-3 border-b border-white/[0.06] pb-4">
                <div>
                    <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-[#71717a]">
                        Usos registrados hoy
                    </p>
                    <AnimatedNumber
                        value={total}
                        isLoading={loading}
                        className="text-3xl font-extrabold tracking-tight text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 min-[640px]:grid-cols-3">
                {DASHBOARD_USAGE_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.id];
                    const value = cat.keys.reduce((sum, key) => sum + (stats[key] ?? 0), 0);
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

                    return (
                        <div key={cat.id} className={CATEGORY_TILE}>
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                                <Icon className="size-4" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#71717a]">
                                    {cat.label}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <AnimatedNumber
                                        value={value}
                                        isLoading={loading}
                                        className="text-xl font-bold text-white"
                                    />
                                    {!loading && total > 0 ? (
                                        <span className="text-[0.75rem] text-[#71717a]">{pct}%</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </StatsSectionCard>
    );
}
