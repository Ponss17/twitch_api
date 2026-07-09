import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { ChartMountGate } from './AnalyticsShared';
import { BarChart2 } from 'lucide-react';

interface AnalyticsTodayBarChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 text-sm shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
                <p className="mb-3 border-b border-white/[0.08] pb-2 font-bold capitalize text-[#fafafa]">{label}</p>
                <div className="flex flex-col gap-2">
                    <p className="flex items-center justify-between gap-6 text-[#10b981]">
                        <span>Éxitos:</span> <span className="font-semibold">{data['Éxitos']}</span>
                    </p>
                    {data['Errores'] > 0 && (
                        <p className="flex items-center justify-between gap-6 text-[#ef4444]">
                            <span>Errores:</span> <span className="font-semibold">{data['Errores']}</span>
                        </p>
                    )}
                    <p className="flex items-center justify-between gap-6 text-zinc-400">
                        <span>Total Peticiones:</span> <span className="font-semibold">{data['Total']}</span>
                    </p>
                    <p className="flex items-center justify-between gap-6 text-blue-400">
                        <span>Tasa de Éxito:</span> <span className="font-semibold">{data['Tasa de Éxito']}%</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const chartData = pieData.map(d => ({
        name: d.name,
        'Éxitos': d.value - d.errors,
        'Errores': d.errors,
        'Tasa de Éxito': d.successRate || '0.0',
        'Total': d.value
    }));

    return (
        <div className="col-span-1 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#fafafa]">Rendimiento Detallado por Comando (Hoy)</h2>
                    <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Análisis profundo de peticiones y errores de cada endpoint</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-500">Hoy</span>
                    <InfoTooltip
                        placement="bottom"
                        text="Muestra la cantidad de peticiones totales, destacando los éxitos vs errores para cada comando ejecutado hoy."
                    />
                </div>
            </div>
            
            {chartData.length === 0 ? (
                <div className="flex h-[320px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.05] bg-[#121214]">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#18181b] border border-white/[0.05]">
                        <BarChart2 className="h-6 w-6 text-zinc-500" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Sin actividad reciente</p>
                    <p className="mt-1 text-xs text-zinc-500">Los datos aparecerán aquí cuando tu bot reciba comandos hoy</p>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative h-[320px] w-full min-w-0"
                    srLabel="Gráfico interactivo mostrando éxitos, errores y latencia por comando hoy."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.06} horizontal={true} vertical={true} />
                            
                            {/* Eje primario para peticiones */}
                            <XAxis 
                                dataKey="name" 
                                stroke="#71717a" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={12} 
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
                                content={<CustomTooltip />}
                                cursor={{ fill: '#ffffff', opacity: 0.05 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#c4c4cc' }} iconType="circle" />
                            
                            {/* Area de fondo para Total */}
                            <Area type="monotone" dataKey="Total" fill="url(#colorTotal)" stroke="#8b5cf6" strokeWidth={2} />
                            
                            {/* Barras separadas (no apiladas para que resalten sobre el area) */}
                            <Bar dataKey="Éxitos" fill="url(#colorSuccess)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="Errores" fill="url(#colorErrors)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </div>
    );
}
