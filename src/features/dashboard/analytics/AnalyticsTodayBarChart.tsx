import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartMountGate, COLORS, AnalyticsSection } from './AnalyticsShared';
import { BarChart2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBarShape = (props: any) => {
    const { fill, x, y, width, height, stroke, payload } = props;
    const barFill = payload?.fill ?? fill;
    const barStroke = payload?.fill ?? stroke;
    if (!height || height === 0) return null;

    const radius = 4;
    const fillPath = `M ${x},${y + height} 
                      L ${x},${y + radius} 
                      Q ${x},${y} ${x + radius},${y} 
                      L ${x + width - radius},${y} 
                      Q ${x + width},${y} ${x + width},${y + radius} 
                      L ${x + width},${y + height} 
                      Z`;

    const strokePath = `M ${x},${y + height} 
                        L ${x},${y + radius} 
                        Q ${x},${y} ${x + radius},${y} 
                        L ${x + width - radius},${y} 
                        Q ${x + width},${y} ${x + width},${y + radius} 
                        L ${x + width},${y + height}`;

    return (
        <g>
            <path d={fillPath} fill={barFill} fillOpacity={0.38} />
            <path
                d={strokePath}
                stroke={barStroke}
                strokeWidth={1.2}
                strokeOpacity={0.75}
                strokeDasharray="4 4"
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

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const chartData = pieData.map((d, index) => ({
        name: d.name,
        Éxitos: d.value - d.errors,
        Errores: d.errors,
        'Tasa de Éxito': d.successRate || '0.0',
        Total: d.value,
        fill: COLORS[index % COLORS.length]
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-xl border border-white/10 bg-[#18181b] p-4 shadow-xl">
                    <p className="mb-3 border-b border-white/10 pb-2 text-sm font-semibold capitalize text-white">
                        {label}
                    </p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-sm text-[#10b981]">Éxitos:</span>
                            <span className="text-sm font-bold text-white">
                                {data['Éxitos'].toLocaleString()}
                            </span>
                        </div>
                        {data['Errores'] > 0 && (
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-sm text-[#ef4444]">Errores:</span>
                                <span className="text-sm font-bold text-white">
                                    {data['Errores'].toLocaleString()}
                                </span>
                            </div>
                        )}
                        <div className="mt-1 flex items-center justify-between gap-6 border-t border-white/10 pt-2">
                            <span className="text-sm text-[#c4c4cc]">Total:</span>
                            <span className="text-sm font-bold text-white">
                                {data['Total'].toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-sm text-[#c4c4cc]">Éxito:</span>
                            <span className="text-sm font-bold text-white">
                                {data['Total'] > 0
                                    ? ((data['Éxitos'] / data['Total']) * 100).toFixed(1)
                                    : 0}
                                %
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <AnalyticsSection
            className="col-span-1 lg:col-span-2"
            panelClassName="h-[420px]"
            title="Rendimiento por comando"
            info="Peticiones exitosas y fallidas por comando durante el día."
        >
            {chartData.length === 0 ? (
                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <BarChart2 className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">Sin datos hoy</span>
                    <span className="mt-1 text-xs text-zinc-400">
                        Los comandos aparecerán aquí al usarse
                    </span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="min-h-0 w-full min-w-0 flex-1"
                    srLabel="Gráfico mixto mostrando éxitos y errores por comando."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            accessibilityLayer={false}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff"
                                strokeOpacity={0.06}
                                horizontal={true}
                                vertical={true}
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3, strokeWidth: 1.5 }}
                                tickMargin={12}
                                className="capitalize"
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                tickFormatter={(val) =>
                                    val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                                }
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', color: '#c4c4cc' }}
                                iconType="circle"
                            />
                            <Bar
                                dataKey="Éxitos"
                                fill="#10b981"
                                stroke="#10b981"
                                shape={<CustomBarShape />}
                                maxBarSize={48}
                            />
                            <Bar
                                dataKey="Errores"
                                fill="#ef4444"
                                stroke="#ef4444"
                                shape={<CustomBarShape />}
                                maxBarSize={48}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
