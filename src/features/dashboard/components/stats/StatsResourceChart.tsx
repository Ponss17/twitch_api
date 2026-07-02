import { card, fadeIn } from '@/core/ui/tw';
import type { RankedResourceUsage } from '@/features/dashboard/lib/statsUsage';

interface StatsResourceChartProps {
    rows: RankedResourceUsage[];
    loading?: boolean;
}

const shell = `${card} ${fadeIn} opacity-0`;

export function StatsResourceChart({ rows, loading = false }: StatsResourceChartProps) {
    const max = rows[0]?.value ?? 1;

    return (
        <div className={`${shell} mb-3 [animation-delay:180ms]`}>
            {loading ? (
                <div className="space-y-3 py-2" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <p className="py-8 text-center text-[0.82rem] text-[#71717a]">
                    Aún no hay uso registrado hoy.
                </p>
            ) : (
                <ul className="space-y-2.5" role="list">
                    {rows.map((row) => {
                        const width = Math.max(6, Math.round((row.value / max) * 100));
                        return (
                            <li key={row.key}>
                                <div className="mb-1 flex items-center justify-between gap-3 text-[0.8rem]">
                                    <span className="font-semibold text-[#fafafa]">{row.label}</span>
                                    <span className="font-mono text-[#c4c4cc]">{row.value}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-[#db2777] transition-[width] duration-500"
                                        style={{ width: `${width}%` }}
                                        role="presentation"
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
