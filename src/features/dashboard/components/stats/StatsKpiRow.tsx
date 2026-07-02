import { CheckCircle2, Gauge, Zap } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { sumDashboardCategoryUsage, type DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';

interface StatsKpiRowProps {
    stats: DashboardLiveStats;
    loading?: boolean;
}

const shell = `${card} ${fadeIn} opacity-0`;

export function StatsKpiRow({ stats, loading = false }: StatsKpiRowProps) {
    const resourceUsage = sumDashboardCategoryUsage(stats);
    const requestsDuration = resourceUsage === 0 ? 0 : 1200;
    const successDuration = stats.rawSuccessRate === 0 ? 0 : 1200;
    const latencyDuration = stats.avgLatencyMs === 0 ? 0 : 1200;

    return (
        <div className={`${shell} mb-3 grid grid-cols-1 gap-3 min-[900px]:grid-cols-3 [animation-delay:0ms]`}>
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-secondary p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Zap className="size-5" aria-hidden />
                </div>
                <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#71717a]">
                        Recursos usados (hoy)
                    </p>
                    <AnimatedNumber
                        value={resourceUsage}
                        duration={requestsDuration}
                        isLoading={loading}
                        className="text-2xl font-extrabold text-white"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-secondary p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="size-5" aria-hidden />
                </div>
                <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#71717a]">
                        Éxito (hoy)
                    </p>
                    <AnimatedNumber
                        value={stats.rawSuccessRate}
                        duration={successDuration}
                        isLoading={loading}
                        suffix="%"
                        className="text-2xl font-extrabold text-white"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-bg-secondary p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
                    <Gauge className="size-5" aria-hidden />
                </div>
                <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#71717a]">
                        Latencia media (hoy)
                    </p>
                    <AnimatedNumber
                        value={stats.avgLatencyMs}
                        duration={latencyDuration}
                        isLoading={loading}
                        suffix=" ms"
                        className="text-2xl font-extrabold text-white"
                    />
                </div>
            </div>
        </div>
    );
}
