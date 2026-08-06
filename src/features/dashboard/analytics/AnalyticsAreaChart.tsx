import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { ChartMountGate, AnalyticsSection } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { } from '@/core/i18n/locales/es';

import type { } from 'recharts';

interface AnalyticsAreaChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    areaData: any[];
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
        return (
            <div className="pointer-events-none rounded-xl border border-border-subtle bg-bg-modal p-3 shadow-xl">
                <p className="mb-1 text-xs font-semibold text-text-muted">{label}</p>
                <span className="text-sm font-medium text-text-main">{t.analytics.areaChart.requests} : {payload[0].value}</span>
            </div>
        );
    }
    return null;
};

export function AnalyticsAreaChart({ active, areaData }: AnalyticsAreaChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.areaChart;

    return (
        <AnalyticsSection
            className="col-span-1 lg:col-span-2"
            panelClassName="h-[420px]"
            title={chart.title}
            info={chart.info}
        >
            {!areaData.some(d => d.requests > 0) ? (
                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-transparent">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="h-6 w-6 text-brand-text" />
                    </div>
                    <span className="text-sm font-medium text-text-muted">{chart.noData}</span>
                    <span className="mt-1 text-xs text-text-muted">
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
                    <AreaChart
                        data={areaData}
                        margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                        accessibilityLayer={false}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--text-main)"
                            strokeOpacity={0.1}
                            vertical={true}
                            horizontal={true}
                        />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            tickFormatter={(val) => {
                                const parts = val.split('-');
                                return `${parts[2]}/${parts[1]}`;
                            }}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, (dataMax: number) => (dataMax <= 1 ? 10 : Math.ceil(dataMax * 1.15))]}
                            allowDecimals={false}
                            tickMargin={12}
                        />
                        <Tooltip 
                            content={<CustomTooltip t={t} />} 
                            cursor={false}
                            isAnimationActive={false} 
                            wrapperStyle={{ pointerEvents: 'none', outline: 'none' }} 
                        />
                        <Area
                            type="monotone"
                            dataKey="requests"
                            name={chart.requests}
                            stroke="var(--primary)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#18181b', fill: 'var(--primary)' }}
                            fillOpacity={0.15}
                            fill="var(--primary)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
