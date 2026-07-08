import React, { useMemo, useEffect } from 'react';
import { useDashboardPanel, DashboardPanelProvider } from '@/features/dashboard/providers/DashboardPanelProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { fadeIn, card } from '@/core/ui/tw';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { CardHeaderIcon } from '@/shared/ui/Icon';

import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { Zap, CheckCircle2, Gauge, Command } from 'lucide-react';
import { sumDashboardCategoryUsage } from '@/features/dashboard/lib/dashboardStats';

const STATS_ROW =
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';

const H_STAT =
    'group relative flex flex-col gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-6 py-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04] hover:shadow-2xl';

const COLORS = ['#9146ff', '#00e599', '#facc15', '#ef4444', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6'];

function AnalyticsViewContent({ active }: { active: boolean }) {
    const { stats, hasLiveData, error } = useDashboardPanel();

    const { timeSeries = [] } = stats;

    const { areaData, pieData, summary } = useMemo(() => {
        const dailyMap = new Map<string, { date: string; requests: number; errors: number }>();
        const commandMap = new Map<string, { requests: number; errors: number; latency: number }>();

        // Pre-fill last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

        const uniqueCommands = sortedPie.length;

        return { areaData: sortedPie.length === 0 ? [] : sortedArea, pieData: sortedPie, summary: { totalRequests, successRate, avgLatency, uniqueCommands } };
    }, [timeSeries]);

    // Fix agresivo para Astro DevToolbar: Recharts añade tabindex="0" a muchos elementos 
    // (path, g, section, rect) durante y después de animar, disparando falsos positivos de a11y.
    useEffect(() => {
        if (!active) return;
        const cleanTabIndex = () => {
            document.querySelectorAll('.recharts-wrapper [tabindex]').forEach(el => {
                el.removeAttribute('tabindex');
            });
        };
        
        cleanTabIndex();
        // Las animaciones duran hasta 1500ms, así que limpiamos agresivamente en intervalos
        const interval = setInterval(cleanTabIndex, 100);
        const timeout = setTimeout(() => clearInterval(interval), 2000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [active, areaData, pieData]);

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-[#0f0f11] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const latencyMs = stats.avgLatencyMs ?? 0;
    const resourceUsage = sumDashboardCategoryUsage(stats);
    const successRateDaily = stats.rawSuccessRate ?? 0;
    const isLoading = !hasLiveData;
    const requestsDuration = resourceUsage === 0 ? 0 : 1500;
    const successDuration = active ? 1000 : 0;
    const latencyDuration = active ? 1000 : 0;

    return (
        <div className={`space-y-6 ${fadeIn}`}>

            {/* Contenedor Unificado: Overview + KPIs */}
            <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/[0.08] pb-4">
                    <CardHeaderIcon icon={BarChart3} />
                    <div>
                        <h3 className="mb-0.5 text-[1.05rem] font-bold text-[#fafafa]">Analytics Overview</h3>
                        <p className="text-[0.8rem] text-zinc-400">Métricas de rendimiento de tu API en los últimos 7 días.</p>
                    </div>
                </div>

                <div className={STATS_ROW} aria-busy={isLoading}>
                    {/* Total Requests */}
                    <div className={H_STAT}>
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-sm font-medium text-zinc-300">Peticiones Totales</span>
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <AnimatedNumber
                                value={resourceUsage}
                                duration={requestsDuration}
                                isLoading={isLoading}
                                className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                            />
                            <span className="text-xs text-zinc-500 mt-2 font-medium">realizadas hoy</span>
                        </div>
                    </div>

                    {/* Success Rate */}
                    <div className={H_STAT}>
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-sm font-medium text-zinc-300">Tasa de Éxito</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <AnimatedNumber
                                value={successRateDaily}
                                duration={successDuration}
                                suffix="%"
                                isLoading={isLoading}
                                className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                            />
                            <span className="text-xs text-zinc-500 mt-2 font-medium">peticiones exitosas</span>
                        </div>
                    </div>

                    {/* Avg Processing Time */}
                    <div className={H_STAT}>
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-sm font-medium text-zinc-300">Tiempo de Proceso Medio</span>
                            <Gauge className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-end gap-1.5">
                                <AnimatedNumber
                                    value={latencyMs}
                                    duration={latencyDuration}
                                    isLoading={isLoading}
                                    className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                                />
                                <span className="text-xl font-bold text-white mb-0.5">ms</span>
                            </div>
                            <span className="text-xs text-zinc-500 mt-2 font-medium">latencia global de la API</span>
                        </div>
                    </div>

                    {/* Commands */}
                    <div className={H_STAT}>
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-sm font-medium text-zinc-300">Comandos Usados</span>
                            <Command className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <AnimatedNumber
                                value={summary.uniqueCommands}
                                duration={1500}
                                isLoading={isLoading}
                                className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                            />
                            <span className="text-xs text-zinc-500 mt-2 font-medium">herramientas diferentes invocadas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficas Principales */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Peticiones Diarias (Con Grid muy visible y color morado) */}
                <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6 border-b border-white/[0.08] pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[#fafafa]">Peticiones por Estado (7 días)</h2>
                            <p className="text-xs text-zinc-500 mt-1">Desglose de uso diario</p>
                        </div>
                        <span className="text-xs text-zinc-500">{Intl.DateTimeFormat().resolvedOptions().timeZone} - últimos 7 días</span>
                    </div>
                    <div className="h-[320px] w-full relative">
                        <span className="sr-only">
                            Gráfico de área mostrando las peticiones diarias de los últimos 7 días.
                        </span>
                        <div aria-hidden="true" className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }} accessibilityLayer={false}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9146ff" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#9146ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    {/* GRID Súper visible como en el ejemplo */}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.06} vertical={true} horizontal={true} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#71717a"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={{ stroke: '#ffffff', strokeOpacity: 0.1 }}
                                        tickMargin={12}
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
                                        tickMargin={12}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                                        labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '13px' }}
                                        cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="requests" name="Peticiones" stroke="#9146ff" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 2, stroke: '#18181b', fill: '#9146ff' }} fillOpacity={1} fill="url(#colorRequests)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Uso / Distribución (Donut tipo ejemplo) */}
                <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
                    <div className="mb-6 border-b border-white/[0.08] pb-4">
                        <h2 className="text-lg font-semibold text-[#fafafa]">Uso de Comandos</h2>
                        <p className="text-xs text-zinc-500 mt-1">Distribución general en API</p>
                    </div>
                    <div className="h-[240px] w-full relative mt-4">
                        <span className="sr-only">
                            Gráfico circular mostrando la distribución de comandos utilizados.
                        </span>
                        {pieData.length === 0 || pieData.every(d => d.value === 0) ? (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin datos suficientes</div>
                        ) : (
                            <div aria-hidden="true" className="h-full w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart accessibilityLayer={false}>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={6}
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa' }}
                                            itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text for Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-white tracking-tight">{summary.totalRequests.toLocaleString()}</span>
                                    <span className="text-[0.65rem] uppercase tracking-wider text-zinc-500 font-semibold mt-0.5">Peticiones</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {pieData.length > 0 && pieData.some(d => d.value > 0) && (
                        <div className="mt-8 flex flex-col gap-3">
                            {pieData.slice(0, 4).map((entry, index) => {
                                const percentage = summary.totalRequests > 0 ? ((entry.value / summary.totalRequests) * 100).toFixed(1) : '0.0';
                                return (
                                    <div key={entry.name} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 transition hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <span className="size-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            <span className="capitalize truncate text-sm font-medium text-zinc-200" title={entry.name}>{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-zinc-400">{entry.value.toLocaleString()}</span>
                                            <span className="text-xs font-bold text-white w-10 text-right">{percentage}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Desglose por Comando (Tabla) */}
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
                    <div className="mb-6 border-b border-white/[0.08] pb-4">
                        <h2 className="text-lg font-semibold text-[#fafafa]">Endpoints Más Usados</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.05] text-zinc-500">
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
                                        <tr key={row.name} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3.5 capitalize text-zinc-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-right font-medium text-white">{row.value.toLocaleString()}</td>
                                            <td className="py-3.5 text-right">
                                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${parseFloat(row.successRate) > 95 ? 'bg-emerald-500/10 text-emerald-400' : parseFloat(row.successRate) > 80 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {row.successRate}%
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right text-zinc-400 font-mono text-xs">{row.avgLatency}ms</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gráfico de Latencia (BarChart) */}
                <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
                    <div className="mb-6 border-b border-white/[0.08] pb-4">
                        <h2 className="text-lg font-semibold text-[#fafafa]">Comparativa de Latencia</h2>
                        <p className="text-xs text-zinc-500 mt-1">Tiempo de proceso por comando</p>
                    </div>
                    <div className="h-[280px] w-full relative">
                        <span className="sr-only">
                            Gráfico de barras mostrando la latencia promedio por comando.
                        </span>
                        {pieData.length === 0 || pieData.every(d => d.avgLatency === 0) ? (
                            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Sin datos de latencia</div>
                        ) : (
                            <div aria-hidden="true" className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pieData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} accessibilityLayer={false}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} horizontal={true} vertical={true} />
                                        <XAxis
                                            type="number"
                                            stroke="#71717a"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tickFormatter={(val) => `${val}ms`}
                                            domain={[0, (dataMax: number) => (dataMax === 0 ? 10 : dataMax)]}
                                        />
                                        <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} className="capitalize" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa' }}
                                            itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                                            cursor={false}
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
            <AnalyticsViewContent active={active} />
        </DashboardPanelProvider>
    );
}
