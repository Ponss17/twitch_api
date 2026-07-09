import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { ChartMountGate } from './AnalyticsShared';

interface AnalyticsTodayBarChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const chartData = pieData.map(d => ({
        name: d.name,
        'Éxitos': d.value - d.errors,
        'Errores': d.errors
    }));

    return (
        <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#fafafa]">Peticiones por Estado (Hoy)</h2>
                    <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Desglose de uso por comando</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-500">Hoy</span>
                    <InfoTooltip
                        placement="bottom"
                        text="Cantidad de peticiones exitosas vs errores por comando en el día actual."
                    />
                </div>
            </div>
            
            {chartData.length === 0 ? (
                <div className="flex h-[320px] w-full items-center justify-center text-sm text-zinc-500">
                    Sin datos hoy
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative h-[320px] w-full min-w-0"
                    srLabel="Gráfico de barras mostrando éxitos vs errores por comando hoy."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} horizontal={true} vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#71717a" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={10} 
                                className="capitalize"
                            />
                            <YAxis 
                                stroke="#71717a" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={10}
                                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fafafa' }}
                                itemStyle={{ fontWeight: 500 }}
                                cursor={{ fill: '#ffffff', opacity: 0.05 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#c4c4cc' }} iconType="circle" />
                            <Bar dataKey="Éxitos" fill="url(#colorSuccess)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                            <Bar dataKey="Errores" fill="url(#colorErrors)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </div>
    );
}
