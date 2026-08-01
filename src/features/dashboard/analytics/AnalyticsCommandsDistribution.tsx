import React from 'react';
import { Command } from 'lucide-react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartMountGate, COLORS, AnalyticsSection } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { } from 'recharts';

interface AnalyticsCommandsDistributionProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
    totalRequests: number;
}

interface Custom{
    active?: boolean;
    // eslint-disable-next-line
    payload?: any[];
}

const CustomTooltip = ({ active, payload }: Custom) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="pointer-events-none rounded-xl border border-white/10 bg-[#18181b] px-3 py-2 shadow-xl">
                <span className="font-semibold text-white capitalize">
                    {data.name} : {data.value}
                </span>
            </div>
        );
    }
    return null;
};

export function AnalyticsCommandsDistribution({
    active,
    pieData,
    totalRequests
}: AnalyticsCommandsDistributionProps) {
    const { t } = useTranslation();
    const chart = t.analytics.distributionChart;

    return (
        <AnalyticsSection
            className="col-span-1"
            panelClassName="h-[420px]"
            title={chart.title}
            info={chart.info}
        >
            {pieData.length === 0 ? (
                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Command className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">{chart.noData}</span>
                    <span className="mt-1 text-xs text-zinc-400">{chart.noDataSub}</span>
                </div>
            ) : (
                <ChartMountGate
                    active={active}
                    srLabel={chart.title}
                    className="min-h-[200px] w-full min-w-0 flex-1"
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart accessibilityLayer={false}>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="78%"
                                dataKey="value"
                                isAnimationActive={false}
                                cornerRadius={4}
                                stroke="none"
                                activeShape={false}
                            />
                            <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={{ fill: 'transparent' }}
                                isAnimationActive={false} 
                                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
            {pieData.length > 0 && pieData.some((d) => d.value > 0) && (
                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {pieData.map((entry, index) => {
                        const pct = totalRequests > 0 ? (entry.value / totalRequests) * 100 : 0;
                        const percentage = pct.toFixed(1);
                        const color = COLORS[index % COLORS.length];
                        return (
                            <div
                                key={entry.name}
                                className="flex flex-col gap-1.5 rounded-lg bg-bg-main/60 px-2.5 py-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span
                                            className="truncate text-sm font-medium capitalize text-zinc-200"
                                            title={entry.name}
                                        >
                                            {entry.name}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <span className="text-xs text-zinc-400">
                                            {entry.value.toLocaleString()}
                                        </span>
                                        <span
                                            className="w-10 text-right text-xs font-bold"
                                            style={{ color }}
                                        >
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: color,
                                            opacity: 0.7
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AnalyticsSection>
    );
}
