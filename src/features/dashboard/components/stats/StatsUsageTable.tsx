import { card, fadeIn } from '@/core/ui/tw';
import { DASHBOARD_USAGE_KEYS } from '@/features/dashboard/lib/dashboardStats';
import { RESOURCE_LABELS } from '@/features/dashboard/lib/statsUsage';
import type { DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';

interface StatsUsageTableProps {
    stats: DashboardLiveStats;
    loading?: boolean;
}

const shell = `${card} ${fadeIn} opacity-0`;

export function StatsUsageTable({ stats, loading = false }: StatsUsageTableProps) {
    const rows = DASHBOARD_USAGE_KEYS.map((key) => ({
        key,
        label: RESOURCE_LABELS[key],
        value: stats[key] ?? 0
    }));

    const total = rows.reduce((sum, row) => sum + row.value, 0);

    return (
        <div className={`${shell} mb-3 [animation-delay:300ms]`}>
            {loading ? (
                <div className="space-y-2 py-2" aria-hidden>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] text-left text-[0.82rem]">
                        <thead>
                            <tr className="border-b border-white/[0.08] text-[0.65rem] font-bold uppercase tracking-wide text-[#71717a]">
                                <th className="px-3 py-2.5 font-bold">Recurso</th>
                                <th className="px-3 py-2.5 text-right font-bold">Usos hoy</th>
                                <th className="hidden px-3 py-2.5 text-right font-bold min-[520px]:table-cell">
                                    % del total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                                return (
                                    <tr
                                        key={row.key}
                                        className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                                    >
                                        <td className="px-3 py-2.5 font-medium text-[#fafafa]">{row.label}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#c4c4cc]">
                                            {row.value}
                                        </td>
                                        <td className="hidden px-3 py-2.5 text-right font-mono text-[#71717a] min-[520px]:table-cell">
                                            {total > 0 ? `${pct}%` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                                <td className="px-3 py-2.5 font-semibold text-white">Total</td>
                                <td className="px-3 py-2.5 text-right font-mono font-semibold text-primary">
                                    {total}
                                </td>
                                <td className="hidden min-[520px]:table-cell" />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
