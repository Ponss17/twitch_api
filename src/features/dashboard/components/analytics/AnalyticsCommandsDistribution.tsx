import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { ChartMountGate, COLORS } from './AnalyticsShared';

interface AnalyticsCommandsDistributionProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
    totalRequests: number;
}

export function AnalyticsCommandsDistribution({
    active,
    pieData,
    totalRequests
}: AnalyticsCommandsDistributionProps) {
    return (
        <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
            <div className="mb-6 border-b border-white/[0.08] pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-[#fafafa]">Uso de Comandos</h2>
                        <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Distribución general en API</p>
                    </div>
                    <InfoTooltip text="Proporción de uso de los diferentes comandos y minijuegos en la última semana." />
                </div>
            </div>
            {pieData.length === 0 || pieData.every((d) => d.value === 0) ? (
                <div className="mt-4 flex h-[240px] w-full items-center justify-center text-sm text-zinc-500">
                    Sin datos suficientes
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative mt-4 h-[240px] w-full min-w-0"
                    srLabel="Gráfico circular mostrando la distribución de comandos utilizados."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart accessibilityLayer={false}>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={95}
                                dataKey="value"
                            >
                                {pieData.map((_, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]}
                                        fillOpacity={0.22}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2}
                                        strokeOpacity={0.8}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa' }}
                                itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
            {pieData.length > 0 && pieData.some((d) => d.value > 0) && (
                <div className="mt-8 flex flex-col gap-3">
                    {pieData.slice(0, 4).map((entry, index) => {
                        const percentage = totalRequests > 0 ? ((entry.value / totalRequests) * 100).toFixed(1) : '0.0';
                        const pct = totalRequests > 0 ? (entry.value / totalRequests) * 100 : 0;
                        const color = COLORS[index % COLORS.length];
                        return (
                            <div key={entry.name} className="flex flex-col gap-1.5 rounded-lg bg-white/[0.02] p-2.5 transition hover:bg-white/[0.04]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="capitalize truncate text-sm font-medium text-zinc-200" title={entry.name}>{entry.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-zinc-400">{entry.value.toLocaleString()}</span>
                                        <span className="text-xs font-bold w-10 text-right" style={{ color }}>{percentage}%</span>
                                    </div>
                                </div>
                                <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
