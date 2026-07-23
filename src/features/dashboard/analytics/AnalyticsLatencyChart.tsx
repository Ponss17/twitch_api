import React from 'react';
import { Timer } from 'lucide-react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartMountGate, COLORS, AnalyticsSection } from './AnalyticsShared';

interface AnalyticsLatencyChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsLatencyChart({ active, pieData }: AnalyticsLatencyChartProps) {
    return (
        <AnalyticsSection
            panelClassName="min-h-[360px]"
            title="Latencia por comando"
            info="Promedio en milisegundos que tarda cada comando en responder."
        >
            {pieData.length === 0 || pieData.every((d) => d.avgLatency === 0) ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Timer className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">Sin datos de latencia</span>
                    <span className="mt-1 text-xs text-zinc-400">
                        Espera a que lleguen nuevas peticiones
                    </span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative min-h-0 w-full min-w-0 flex-1"
                    srLabel="Gráfico de barras mostrando la latencia promedio por comando."
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart
                            data={pieData}
                            layout="vertical"
                            margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                            accessibilityLayer={false}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff"
                                strokeOpacity={0.05}
                                horizontal={true}
                                vertical={true}
                            />
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
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3, strokeWidth: 1.5 }}
                                className="capitalize"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid #27272a',
                                    borderRadius: '12px',
                                    color: '#fafafa'
                                }}
                                itemStyle={{ color: '#fafafa', fontWeight: 500 }}
                                // @ts-expect-error - Recharts Tooltip types are complex and generic
                                formatter={(value: number | string | undefined) => {
                                    const valNum = Number(value) || 0;
                                    return [`${valNum}ms (${(valNum / 1000).toFixed(3)}s)`, 'Latencia'];
                                }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar
                                dataKey="avgLatency"
                                name="Latencia"
                                maxBarSize={16}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                shape={(props: any) => {
                                    const color = COLORS[props.index % COLORS.length];
                                    return (
                                        <Rectangle
                                            {...props}
                                            fill={color}
                                            fillOpacity={0.38}
                                            stroke={color}
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    );
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
