import { Gamepad2, Terminal, TrendingUp, Wrench } from 'lucide-react';
import { card, fadeIn } from '@/core/ui/tw';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import {
    DASHBOARD_USAGE_CATEGORIES,
    DASHBOARD_USAGE_KEYS,
    sumDashboardCategoryUsage
} from '@/features/dashboard/lib/dashboardStats';
import {
    categoryUsageBreakdown,
    rankResourceUsage,
    RESOURCE_LABELS,
    totalCategoryUsage
} from '@/features/dashboard/lib/statsUsage';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

const CATEGORY_META = {
    'cat-commands': { icon: Terminal, color: '#9146ff', bg: 'bg-primary/10', border: 'border-primary/25' },
    'cat-tools': { icon: Wrench, color: '#db2777', bg: 'bg-[#db2777]/10', border: 'border-[#db2777]/25' },
    'cat-minigames': { icon: Gamepad2, color: '#a78bfa', bg: 'bg-violet-400/10', border: 'border-violet-400/25' }
} as const;

const shell = `${card} ${fadeIn} opacity-0`;

function StatsSyncBadge({ syncing, label }: { syncing: boolean; label: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[0.7rem] font-medium text-[#c4c4cc] ${syncing ? 'border-primary/30 text-primary' : ''}`}
        >
            <span
                className={`size-1.5 rounded-full ${syncing ? 'animate-pulse bg-primary' : label === 'Realtime' ? 'bg-emerald-400' : 'bg-[#71717a]'}`}
            />
            {syncing ? 'Sincronizando' : label}
        </span>
    );
}

function StatsEmpty({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[#71717a]">
                <TrendingUp className="size-5" aria-hidden />
            </div>
            <p className="text-[0.85rem] text-[#c4c4cc]">{message}</p>
        </div>
    );
}

function buildDonutGradient(
    slices: ReturnType<typeof categoryUsageBreakdown>,
    total: number
): string {
    const colors = ['#9146ff', '#db2777', '#a78bfa'];
    if (total <= 0) return 'conic-gradient(#27272a 0deg 360deg)';
    let cursor = 0;
    const stops: string[] = [];
    slices.forEach((slice, i) => {
        if (slice.value <= 0) return;
        const angle = (slice.value / total) * 360;
        const next = cursor + angle;
        stops.push(`${colors[i % colors.length]} ${cursor}deg ${next}deg`);
        cursor = next;
    });
    if (cursor < 360) stops.push(`#27272a ${cursor}deg 360deg`);
    return `conic-gradient(${stops.join(', ')})`;
}

export function StatsView({ active: _active = true }: { active?: boolean }) {
    const { stats, hasLiveData, syncing, syncLabel } = useDashboardPanel();
    const loading = !hasLiveData;

    const total = sumDashboardCategoryUsage(stats);
    const ranked = rankResourceUsage(stats);
    const categories = categoryUsageBreakdown(stats);
    const categoryTotal = totalCategoryUsage(categories);
    const maxBar = ranked[0]?.value ?? 1;

    return (
        <div className={`${fadeIn} space-y-3`}>
            {/* Cabecera compacta */}
            <div className={`${shell} flex flex-wrap items-center justify-between gap-3 [animation-delay:0ms]`}>
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <TrendingUp className="size-5" aria-hidden />
                    </div>
                    <div>
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#71717a]">
                            Usos registrados hoy
                        </p>
                        <AnimatedNumber
                            value={total}
                            isLoading={loading}
                            className="text-2xl font-extrabold tracking-tight text-white"
                        />
                    </div>
                </div>
                <StatsSyncBadge syncing={syncing} label={syncLabel} />
            </div>

            {/* Resumen por categoría */}
            <div className={`${shell} grid grid-cols-1 gap-2.5 min-[640px]:grid-cols-3 [animation-delay:60ms]`}>
                {DASHBOARD_USAGE_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat.id];
                    const Icon = meta.icon;
                    const value = cat.keys.reduce((sum, key) => sum + (stats[key] ?? 0), 0);
                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                    return (
                        <div
                            key={cat.id}
                            className={`flex items-center gap-3 rounded-xl border ${meta.border} ${meta.bg} p-3`}
                        >
                            <div
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20"
                                style={{ color: meta.color }}
                            >
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
                                    {!loading && total > 0 && (
                                        <span className="text-[0.75rem] text-[#71717a]">{pct}%</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gráficas lado a lado */}
            <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">
                <div className={`${shell} [animation-delay:120ms]`}>
                    <h3 className="mb-3 text-[0.9rem] font-bold text-white">Uso por recurso</h3>
                    {loading ? (
                        <div className="space-y-2.5" aria-hidden>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
                            ))}
                        </div>
                    ) : ranked.length === 0 ? (
                        <StatsEmpty message="Sin usos registrados hoy." />
                    ) : (
                        <ul className="space-y-3" role="list">
                            {ranked.map((row) => {
                                const width = Math.max(8, Math.round((row.value / maxBar) * 100));
                                return (
                                    <li key={row.key}>
                                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[0.8rem]">
                                            <span className="font-medium text-[#fafafa]">{row.label}</span>
                                            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.75rem] text-[#c4c4cc]">
                                                {row.value}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-primary to-[#db2777] transition-[width] duration-700 ease-out"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className={`${shell} [animation-delay:180ms]`}>
                    <h3 className="mb-3 text-[0.9rem] font-bold text-white">Distribución por categoría</h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-8" aria-hidden>
                            <div className="size-36 animate-pulse rounded-full bg-white/[0.04]" />
                        </div>
                    ) : categoryTotal === 0 ? (
                        <StatsEmpty message="Sin datos de categorías hoy." />
                    ) : (
                        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
                            <div
                                className="relative size-36 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                                style={{ background: buildDonutGradient(categories, categoryTotal) }}
                                role="img"
                                aria-label="Distribución por categoría"
                            >
                                <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-[#09090b]">
                                    <AnimatedNumber
                                        value={categoryTotal}
                                        className="text-2xl font-extrabold text-white"
                                    />
                                    <span className="text-[0.6rem] uppercase tracking-widest text-[#71717a]">
                                        usos
                                    </span>
                                </div>
                            </div>
                            <ul className="w-full max-w-[220px] space-y-2">
                                {categories
                                    .filter((s) => s.value > 0)
                                    .map((slice, i) => {
                                        const colors = ['#9146ff', '#db2777', '#a78bfa'];
                                        const pct = Math.round((slice.value / categoryTotal) * 100);
                                        return (
                                            <li
                                                key={slice.id}
                                                className="flex items-center justify-between gap-2 text-[0.8rem]"
                                            >
                                                <span className="flex items-center gap-2 text-[#fafafa]">
                                                    <span
                                                        className="size-2 rounded-full"
                                                        style={{ backgroundColor: colors[i % 3] }}
                                                    />
                                                    {slice.label}
                                                </span>
                                                <span className="font-mono text-[#71717a]">
                                                    {slice.value} · {pct}%
                                                </span>
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Mapa de todos los recursos — compacto, sin filas vacías dominantes */}
            <div className={`${shell} [animation-delay:240ms]`}>
                <h3 className="mb-3 text-[0.9rem] font-bold text-white">Todos los recursos</h3>
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
            </div>
        </div>
    );
}
