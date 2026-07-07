import React, { useMemo } from 'react';
import { useDashboardPanel, DashboardPanelProvider } from '@/features/dashboard/providers/DashboardPanelProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { fadeIn, card } from '@/core/ui/tw';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { CardHeaderIcon } from '@/shared/ui/Icon';

const COLORS = ['#9146ff', '#00e599', '#facc15', '#ef4444', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6'];

function AnalyticsViewContent() {
    const { stats, hasLiveData, error } = useDashboardPanel();

    const { timeSeries = [] } = stats;

    const { areaData, pieData, summary } = useMemo(() => {
        const dailyMap = new Map<string, { date: string; requests: number; errors: number }>();
        const commandMap = new Map<string, { requests: number; errors: number; latency: number }>();

        // Pre-fill last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyMap.set(dateStr, { date: dateStr, requests: 0, errors: 0 });
        }

        timeSeries.forEach((row) => {
            if (dailyMap.has(row.date)) {
                const day = dailyMap.get(row.date)!;
                day.requests += row.requests_count;
                day.errors += row.errors_count;
            }

            const cmd = row.command_name === 'other' ? 'Otros' : row.command_name;
            if (!commandMap.has(cmd)) {
                commandMap.set(cmd, { requests: 0, errors: 0, latency: 0 });
            }
            const cmdStats = commandMap.get(cmd)!;
            cmdStats.requests += row.requests_count;
            cmdStats.errors += row.errors_count;
            cmdStats.latency += row.latency_sum || 0;
        });

        const sortedArea = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        
        const sortedPie = Array.from(commandMap.entries())
            .map(([name, s]) => ({
                name,
                value: s.requests,
                errors: s.errors,
                successRate: s.requests > 0 ? ((1 - s.errors / s.requests) * 100).toFixed(1) : '0.0',
                avgLatency: s.requests > 0 ? Math.round(s.latency / s.requests) : 0
            }))
            .sort((a, b) => b.value - a.value);

        const totalRequests = Array.from(commandMap.values()).reduce((sum, s) => sum + s.requests, 0);
        const totalErrors = Array.from(commandMap.values()).reduce((sum, s) => sum + s.errors, 0);
        const totalLatency = Array.from(commandMap.values()).reduce((sum, s) => sum + s.latency, 0);
        const avgLatency = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;
        const successRate = totalRequests > 0 ? ((1 - totalErrors / totalRequests) * 100).toFixed(1) : '0.0';

        return { areaData: sortedArea, pieData: sortedPie, summary: { totalRequests, successRate, avgLatency } };
    }, [timeSeries]);

    // Cleanup tabindex on <g> elements to silence Astro Dev Toolbar's strict accessibility linter
    React.useEffect(() => {
        const cleanTabIndex = () => {
            document.querySelectorAll('g[tabindex]').forEach(el => {
                el.removeAttribute('tabindex');
            });
        };
        cleanTabIndex();
        const timer = setTimeout(cleanTabIndex, 50);
        return () => clearTimeout(timer);
    }, [areaData, pieData]);

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-[#0f0f11] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${fadeIn}`}>
            <div className={card}>
                <div className="flex items-center gap-3">
                    <CardHeaderIcon icon={BarChart3} />
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold text-[#fafafa]">Analytics</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">Rendimiento y uso detallado en los últimos 7 días.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-5 transition-colors duration-200 hover:border-primary/60">
                    <p className="mb-1 text-[0.8rem] text-zinc-500">Total Peticiones</p>
                    <p className="text-2xl font-bold text-[#fafafa]">{summary.totalRequests.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-5 transition-colors duration-200 hover:border-primary/60">
                    <p className="mb-1 text-[0.8rem] text-zinc-500">Tasa de Éxito Global</p>
                    <p className={`text-2xl font-bold ${parseFloat(summary.successRate) > 95 ? 'text-emerald-400' : parseFloat(summary.successRate) > 80 ? 'text-yellow-400' : 'text-red-400'}`}>{summary.successRate}%</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-5 transition-colors duration-200 hover:border-primary/60">
                    <p className="mb-1 text-[0.8rem] text-zinc-500">Latencia Promedio</p>
                    <p className="text-2xl font-bold text-zinc-300">{summary.avgLatency}ms</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Peticiones Diarias */}
                <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/60 lg:col-span-2">
                    <h2 className="mb-6 text-lg font-semibold text-[#fafafa]">Peticiones Diarias</h2>
                    <div className="h-[300px] w-full relative">
                        <span className="sr-only">
                            Gráfico de área mostrando las peticiones diarias de los últimos 7 días.
                        </span>
                        <div aria-hidden="true" className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} accessibilityLayer={false}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9146ff" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#9146ff" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.04} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#71717a" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => {
                                            const parts = val.split('-');
                                            return `${parts[2]}/${parts[1]}`;
                                        }}
                                    />
                                    <YAxis 
                                        stroke="#71717a" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        domain={[0, (dataMax: number) => (dataMax === 0 ? 10 : dataMax)]}
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                                        itemStyle={{ color: '#fafafa' }}
                                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="requests" name="Peticiones" stroke="#9146ff" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0, fill: '#9146ff' }} fillOpacity={1} fill="url(#colorRequests)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Distribución */}
                <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/60">
                    <h2 className="mb-6 text-lg font-semibold text-[#fafafa]">Distribución</h2>
                    <div className="h-[300px] w-full relative">
                        <span className="sr-only">
                            Gráfico circular mostrando la distribución de comandos utilizados.
                        </span>
                        {pieData.length === 0 || pieData.every(d => d.value === 0) ? (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin datos suficientes</div>
                        ) : (
                            <div aria-hidden="true" className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart accessibilityLayer={false}>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={72}
                                            outerRadius={88}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                                            itemStyle={{ color: '#fafafa' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    {pieData.length > 0 && pieData.some(d => d.value > 0) && (
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {pieData.slice(0, 4).map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <span className="size-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    <span className="capitalize">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Desglose por Comando (Tabla) */}
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/60">
                    <h2 className="mb-6 text-lg font-semibold text-[#fafafa]">Rendimiento por Comando</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800/50 text-zinc-400">
                                    <th className="pb-3 font-medium">Comando</th>
                                    <th className="pb-3 font-medium text-right">Peticiones</th>
                                    <th className="pb-3 font-medium text-right">Éxito</th>
                                    <th className="pb-3 font-medium text-right">Latencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pieData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-zinc-500">No hay datos suficientes</td>
                                    </tr>
                                ) : (
                                    pieData.map((row, idx) => (
                                        <tr key={row.name} className="border-b border-white/[0.08] last:border-0">
                                            <td className="py-4 capitalize text-zinc-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right text-zinc-300">{row.value.toLocaleString()}</td>
                                            <td className="py-4 text-right">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${parseFloat(row.successRate) > 95 ? 'bg-emerald-500/10 text-emerald-400' : parseFloat(row.successRate) > 80 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {row.successRate}%
                                                </span>
                                            </td>
                                            <td className="py-4 text-right text-zinc-300">{row.avgLatency}ms</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gráfico de Latencia (BarChart en vez de AreaChart) */}
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/60">
                    <h2 className="mb-6 text-lg font-semibold text-[#fafafa]">Comparativa de Latencia</h2>
                    <div className="h-[300px] w-full relative">
                        <span className="sr-only">
                            Gráfico de barras mostrando la latencia promedio por comando.
                        </span>
                        {pieData.length === 0 || pieData.every(d => d.avgLatency === 0) ? (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin datos de latencia</div>
                        ) : (
                            <div aria-hidden="true" className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pieData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} accessibilityLayer={false}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.04} horizontal={false} />
                                        <XAxis 
                                            type="number" 
                                            stroke="#71717a" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(val) => `${val}ms`}
                                            domain={[0, (dataMax: number) => (dataMax === 0 ? 10 : dataMax)]}
                                        />
                                        <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                                        <Tooltip 
                                            cursor={false}
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                                            itemStyle={{ color: '#fafafa' }}
                                        />
                                        <Bar dataKey="avgLatency" name="Latencia" radius={[0, 4, 4, 0]} maxBarSize={16}>
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AnalyticsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { showToast } = useToast();

    return (
        <DashboardPanelProvider active={active} session={session} showToast={showToast}>
            <AnalyticsViewContent />
        </DashboardPanelProvider>
    );
}
