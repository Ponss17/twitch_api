import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { ChartMountGate } from './AnalyticsShared';
import { BarChart2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBarShape = (props: any) => {
    const { fill, x, y, width, height, stroke } = props;
    if (!height || height === 0) return null;

    const radius = 4;
    // Dibuja el relleno cerrado (con esquinas superiores redondeadas)
    const fillPath = `M ${x},${y + height} 
                      L ${x},${y + radius} 
                      Q ${x},${y} ${x + radius},${y} 
                      L ${x + width - radius},${y} 
                      Q ${x + width},${y} ${x + width},${y + radius} 
                      L ${x + width},${y + height} 
                      Z`;
                      
    // Dibuja el borde SIN la linea de abajo
    const strokePath = `M ${x},${y + height} 
                        L ${x},${y + radius} 
                        Q ${x},${y} ${x + radius},${y} 
                        L ${x + width - radius},${y} 
                        Q ${x + width},${y} ${x + width},${y + radius} 
                        L ${x + width},${y + height}`;

    return (
        <g>
            <path d={fillPath} fill={fill} />
            <path 
                d={strokePath} 
                stroke={stroke} 
                strokeWidth={1.5} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
            />
        </g>
    );
};

interface AnalyticsTodayBarChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsTodayBarChart({
    active,
    pieData
}: AnalyticsTodayBarChartProps) {
    const chartData = pieData.map(d => ({
        name: d.name,
        'Éxitos': d.value - d.errors,
        'Errores': d.errors,
        'Tasa de Éxito': d.successRate || '0.0',
        'Total': d.value
    }));
    // Componente custom para el tooltip
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-xl border border-white/10 bg-[#18181b] p-4 shadow-xl">
                    <p className="mb-3 border-b border-white/10 pb-2 text-sm font-semibold text-white capitalize">{label}</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-sm text-[#10b981]">Éxitos:</span>
                            <span className="text-sm font-bold text-white">{data['Éxitos'].toLocaleString()}</span>
                        </div>
                        {data['Errores'] > 0 && (
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-sm text-[#ef4444]">Errores:</span>
                                <span className="text-sm font-bold text-white">{data['Errores'].toLocaleString()}</span>
                            </div>
                        )}
                        <div className="mt-1 flex items-center justify-between gap-6 border-t border-white/10 pt-2">
                            <span className="text-sm text-[#c4c4cc]">Total Peticiones:</span>
                            <span className="text-sm font-bold text-white">{data['Total'].toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-sm text-[#c4c4cc]">Tasa de Éxito:</span>
                            <span className="text-sm font-bold text-white">
                                {data['Total'] > 0 ? ((data['Éxitos'] / data['Total']) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="col-span-1 lg:col-span-2 flex flex-col rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
            <div className="mb-6 border-b border-white/[0.08] pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-[#fafafa]">Rendimiento Detallado por Comando (Hoy)</h2>
                        <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Análisis profundo de peticiones y errores de cada endpoint</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <InfoTooltip text="Muestra las peticiones exitosas y fallidas, además de la latencia media, para cada comando durante el día actual." />
                    </div>
                </div>
            </div>
            
            {chartData.length === 0 ? (
                <div className="mt-4 flex h-[350px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3">
                        <BarChart2 className="h-6 w-6 text-zinc-500" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">Aún no hay datos registrados hoy</span>
                    <span className="mt-1 text-xs text-zinc-500">Los comandos ejecutados aparecerán aquí en tiempo real</span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="mt-4 h-[350px] w-full min-w-0"
                    srLabel="Gráfico mixto mostrando éxitos y errores por comando."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.06} horizontal={true} vertical={true} />
                            
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
                            
                            {/* Barras con bordes fuertes y gradiente interior (estilo Nightbot) */}
                            <Bar dataKey="Éxitos" fill="url(#colorSuccess)" stroke="url(#colorSuccess)" shape={<CustomBarShape />} maxBarSize={48} />
                            <Bar dataKey="Errores" fill="url(#colorErrors)" stroke="url(#colorErrors)" shape={<CustomBarShape />} maxBarSize={48} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </div>
    );
}
