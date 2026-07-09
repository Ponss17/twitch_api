import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { ChartMountGate, COLORS } from './AnalyticsShared';

interface AnalyticsLatencyChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsLatencyChart({ active, pieData }: AnalyticsLatencyChartProps) {
    return (
        <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
            <div className="mb-6 border-b border-white/[0.08] pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-[#fafafa]">Comparativa de Latencia</h2>
                        <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Promedio por comando</p>
                    </div>
                    <InfoTooltip text="Tiempo promedio que le toma a tu servidor procesar cada comando específico." />
                </div>
            </div>
            {pieData.length === 0 || pieData.every((d) => d.avgLatency === 0) ? (
                <div className="flex h-[280px] w-full items-center justify-center text-sm text-zinc-500">
                    Sin datos de latencia
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative h-[280px] w-full min-w-0"
                    srLabel="Gráfico de barras mostrando la latencia promedio por comando."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                            <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3, strokeWidth: 1.5 }} className="capitalize" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa' }}
                                itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                                cursor={false}
                            />
                            <Bar dataKey="avgLatency" name="Latencia" radius={[0, 4, 4, 0]} maxBarSize={16}>
                                {pieData.map((_, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        fillOpacity={0.15}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={1.5}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </div>
    );
}
