import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartMountGate, COLORS, AnalyticsSection } from './AnalyticsShared';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useMemo } from 'react';
import type { } from 'recharts';


interface AnalyticsTodayBarChartProps {
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
    chart: any;
}

const CustomTooltip = ({ active, payload, label, chart }: Custom) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="pointer-events-none rounded-xl border border-white/10 bg-[#18181b] p-4 shadow-xl">
                <p className="mb-3 border-b border-white/10 pb-2 text-sm font-semibold capitalize text-white">
                    {label}
                </p>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-sm text-[#10b981]">{chart.success}:</span>
                        <span className="text-sm font-bold text-white">
                            {Number(data[chart.success]).toLocaleString()}
                        </span>
                    </div>
                    {data[chart.errors] > 0 && (
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-sm text-[#ef4444]">{chart.errors}:</span>
                            <span className="text-sm font-bold text-white">
                                {Number(data[chart.errors]).toLocaleString()}
                            </span>
                        </div>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-6 border-t border-white/10 pt-2">
                        <span className="text-sm text-[#c4c4cc]">{chart.total}:</span>
                        <span className="text-sm font-bold text-white">
                            {Number(data[chart.total]).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-sm text-[#c4c4cc]">{chart.successRate}:</span>
                        <span className="text-sm font-bold text-white">
                            {data[chart.total] > 0
                                ? ((data[chart.success] / data[chart.total]) * 100).toFixed(1)
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

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.todayChart;

    const chartData = useMemo(() => {
        return pieData.map((d, index) => ({
            name: d.name,
            [chart.success]: d.value - d.errors,
            [chart.errors]: d.errors,
            [chart.successRate]: d.successRate || '0.0',
            [chart.total]: d.value,
            fill: COLORS[index % COLORS.length]
        }));
    }, [pieData, chart]);

    return (
        <AnalyticsSection
            className="col-span-1 lg:col-span-2"
            panelClassName="h-[420px]"
            title={chart.title}
            info={chart.info}
        >
            {chartData.length === 0 ? (
                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <BarChart2 className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">{chart.noData}</span>
                    <span className="mt-1 text-xs text-zinc-400">
                        {chart.noDataSub}
                    </span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    className="min-h-[250px] w-full min-w-0 flex-1"
                    srLabel={chart.title}
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
                                tickFormatter={(val) =>
                                    val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                                }
                            />
                            <Tooltip 
                                content={<CustomTooltip chart={chart} />} 
                                cursor={false} 
                                isAnimationActive={false} 
                                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }} 
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', color: '#c4c4cc' }}
                                iconType="circle"
                            />
                            <Bar
                                dataKey={chart.success}
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={48}
                            />
                            <Bar
                                dataKey={chart.errors}
                                fill="#ef4444"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={48}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
