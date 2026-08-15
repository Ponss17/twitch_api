import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { AnalyticsSection, ChartMountGate, COLORS, AnalyticsEmptyState } from './AnalyticsShared';

interface AnalyticsTodayBarChartProps {
    active: boolean;
    pieData: Array<{ name: string; value: number }>;
}

function CustomTooltip({
    active,
    payload,
    label,
    requestsLabel
}: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
    requestsLabel: string;
}) {
    if (!active || !payload?.length) return null;
    const total = Number(payload[0]?.value ?? 0);
    return (
        <div className="pointer-events-none rounded-xl border border-border-subtle bg-bg-modal p-4 shadow-xl">
            <p className="mb-3 border-b border-border-subtle pb-2 text-sm font-semibold capitalize text-text-main">
                {label}
            </p>
            <div className="flex items-center justify-between gap-6">
                <span className="text-sm text-text-muted">{requestsLabel}:</span>
                <span className="text-sm font-bold text-text-main">{total.toLocaleString()}</span>
            </div>
        </div>
    );
}

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.todayChart;
    const requestsLabel = t.analytics.kpis.requests;

    const chartData = useMemo(
        () =>
            pieData.map((d, index) => ({
                name: d.name,
                requests: d.value,
                fill: COLORS[index % COLORS.length]
            })),
        [pieData]
    );

    return (
        <AnalyticsSection
            className="col-span-1"
            panelClassName="h-[320px]"
            title={chart.title}
            info={chart.info}
        >
            {chartData.length === 0 ? (
                <AnalyticsEmptyState
                    icon={BarChart2}
                    title={chart.noData}
                    description={chart.noDataSub}
                />
            ) : (
                <ChartMountGate
                    active={active}
                    className="min-h-[200px] w-full min-w-0 flex-1"
                    srLabel={chart.title}
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            accessibilityLayer={false}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--text-main)"
                                strokeOpacity={0.1}
                                horizontal
                                vertical
                            />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={12}
                                className="capitalize"
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                allowDecimals={false}
                                tickFormatter={(val) =>
                                    val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                                }
                            />
                            <Tooltip
                                content={<CustomTooltip requestsLabel={requestsLabel} />}
                                cursor={false}
                                isAnimationActive={false}
                                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                            />
                            <Bar dataKey="requests" name={requestsLabel} radius={[4, 4, 0, 0]} maxBarSize={48}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
