import React from 'react';
import { Timer } from 'lucide-react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartMountGate, COLORS, AnalyticsSection } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { } from '@/core/i18n/locales/es';

import type { RectangleProps } from 'recharts';

interface AnalyticsLatencyChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

interface Custom{
    active?: boolean;
    // eslint-disable-next-line
    payload?: any[];
    label?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
}

const CustomTooltip = ({ active, payload, label, t }: Custom) => {
    if (active && payload && payload.length) {
        const valNum = Number(payload[0].value) || 0;
        return (
            <div className="pointer-events-none rounded-xl border border-white/10 bg-[#18181b] p-3 shadow-xl">
                <p className="mb-1 font-semibold capitalize text-white">{label}</p>
                <span className="text-sm font-medium text-white">{t.analytics.latencyChart.latency} : {valNum}ms ({(valNum / 1000).toFixed(3)}s)</span>
            </div>
        );
    }
    return null;
};

interface CustomBarShapeProps extends RectangleProps {
    index?: number;
    isActive?: boolean;
}

const CustomBarShape = (props: CustomBarShapeProps) => {
    const { x = 0, y = 0, index = 0, isActive = false, ...rest } = props;
    const color = COLORS[index % COLORS.length];
    const gradientId = `lat-gradient-${isActive ? 'active-' : ''}${Math.round(Number(x))}-${Math.round(Number(y))}`;
    return (
        <g>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity={0} />
                    <stop offset="100%" stopColor={color} stopOpacity={isActive ? 0.8 : 0.6} />
                </linearGradient>
            </defs>
            <Rectangle
                {...rest}
                x={x}
                y={y}
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                stroke={color}
                strokeWidth={1}
                strokeOpacity={isActive ? 0.8 : 0.4}
                radius={[0, 4, 4, 0]}
            />
        </g>
    );
};

export function AnalyticsLatencyChart({ active, pieData }: AnalyticsLatencyChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.latencyChart;
    
    return (
        <AnalyticsSection
            panelClassName="h-full min-h-[360px] flex flex-col"
            title={chart.title}
            info={chart.info}
        >
            {pieData.length === 0 || pieData.every((d) => d.avgLatency === 0) ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Timer className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">{chart.noData}</span>
                    <span className="mt-1 text-xs text-zinc-400">
                        {chart.noDataSub}
                    </span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="min-h-[300px] w-full min-w-0 flex-1"
                    srLabel={chart.title}
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
                                axisLine={false}
                                className="capitalize"
                            />
                            <Tooltip 
                                content={<CustomTooltip t={t} />} 
                                cursor={false} 
                                isAnimationActive={false} 
                                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }} 
                            />
                            <Bar
                                dataKey="avgLatency"
                                name={chart.latency}
                                maxBarSize={16}
                                shape={<CustomBarShape />}
                                activeBar={<CustomBarShape isActive />}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
