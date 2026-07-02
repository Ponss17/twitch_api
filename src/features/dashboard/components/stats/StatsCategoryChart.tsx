import { card, fadeIn } from '@/core/ui/tw';
import {
    categoryUsageBreakdown,
    totalCategoryUsage,
    type CategoryUsageSlice
} from '@/features/dashboard/lib/statsUsage';
import type { DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';

interface StatsCategoryChartProps {
    stats: DashboardLiveStats;
    loading?: boolean;
}

const COLORS = ['#9146ff', '#3b82f6', '#10b981'] as const;
const shell = `${card} ${fadeIn} opacity-0`;

function buildConicGradient(slices: CategoryUsageSlice[], total: number): string {
    if (total <= 0) return 'conic-gradient(#27272a 0deg 360deg)';
    let cursor = 0;
    const stops: string[] = [];
    slices.forEach((slice, index) => {
        if (slice.value <= 0) return;
        const angle = (slice.value / total) * 360;
        const next = cursor + angle;
        stops.push(`${COLORS[index % COLORS.length]} ${cursor}deg ${next}deg`);
        cursor = next;
    });
    if (cursor < 360) {
        stops.push(`#27272a ${cursor}deg 360deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
}

export function StatsCategoryChart({ stats, loading = false }: StatsCategoryChartProps) {
    const slices = categoryUsageBreakdown(stats);
    const total = totalCategoryUsage(slices);

    return (
        <div className={`${shell} mb-3 [animation-delay:240ms]`}>
            {loading ? (
                <div className="flex items-center gap-6 py-4" aria-hidden>
                    <div className="size-28 animate-pulse rounded-full bg-white/[0.04]" />
                    <div className="flex-1 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-4 animate-pulse rounded bg-white/[0.04]" />
                        ))}
                    </div>
                </div>
            ) : total === 0 ? (
                <p className="py-8 text-center text-[0.82rem] text-[#71717a]">
                    Sin datos de categorías hoy.
                </p>
            ) : (
                <div className="flex flex-col items-center gap-5 min-[640px]:flex-row min-[640px]:items-center">
                    <div
                        className="relative size-32 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        style={{ background: buildConicGradient(slices, total) }}
                        role="img"
                        aria-label="Distribución por categoría"
                    >
                        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#09090b] text-center">
                            <span className="text-xl font-extrabold text-white">{total}</span>
                            <span className="text-[0.65rem] uppercase tracking-wide text-[#71717a]">total</span>
                        </div>
                    </div>
                    <ul className="w-full space-y-2">
                        {slices
                            .filter((slice) => slice.value > 0)
                            .map((slice, index) => {
                            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
                            return (
                                <li
                                    key={slice.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[0.8rem]"
                                >
                                    <span className="flex items-center gap-2 font-medium text-[#fafafa]">
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            aria-hidden
                                        />
                                        {slice.label}
                                    </span>
                                    <span className="font-mono text-[#c4c4cc]">
                                        {slice.value} · {pct}%
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
