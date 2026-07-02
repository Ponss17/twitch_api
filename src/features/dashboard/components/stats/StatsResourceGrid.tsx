import { LayoutGrid } from 'lucide-react';

import { DASHBOARD_USAGE_KEYS, type DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';
import { RESOURCE_LABELS } from '@/features/dashboard/lib/statsUsage';
import { StatsSectionCard } from '@/features/dashboard/components/stats/StatsSectionCard';

interface StatsResourceGridProps {
    stats: DashboardLiveStats;
    loading: boolean;
    delay?: number;
}

export function StatsResourceGrid({ stats, loading, delay = 240 }: StatsResourceGridProps) {
    return (
        <StatsSectionCard
            icon={LayoutGrid}
            title="Detalle por recurso"
            subtitle="Contador individual de cada comando, herramienta y minijuego"
            info="Los recursos con uso hoy se resaltan en morado. Los que están en cero aparecen atenuados."
            delay={delay}
        >
            {loading ? (
                <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-5" aria-hidden>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-5">
                    {DASHBOARD_USAGE_KEYS.map((key) => {
                        const value = stats[key] ?? 0;
                        const active = value > 0;

                        return (
                            <div
                                key={key}
                                className={`rounded-xl border px-3 py-2.5 transition ${
                                    active
                                        ? 'border-primary/25 bg-primary/[0.06]'
                                        : 'border-white/[0.05] bg-white/[0.02] opacity-50'
                                }`}
                            >
                                <p className="truncate text-[0.7rem] font-medium text-[#c4c4cc]">
                                    {RESOURCE_LABELS[key]}
                                </p>
                                <p
                                    className={`mt-0.5 text-lg font-bold tabular-nums ${active ? 'text-white' : 'text-[#71717a]'}`}
                                >
                                    {value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </StatsSectionCard>
    );
}
