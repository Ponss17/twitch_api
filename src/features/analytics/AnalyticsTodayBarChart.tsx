import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import {
    AnalyticsSection,
    AnalyticsEmptyState,
    evenYAxis,
    useStripRechartsTabIndex
} from './AnalyticsShared';

interface AnalyticsTodayBarChartProps {
    active: boolean;
    pieData: Array<{ name: string; value: number; errors?: number }>;
}

function CustomTooltip({
    active,
    payload,
    label,
    requestsLabel,
    errorsLabel
}: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
    requestsLabel: string;
    errorsLabel: string;
}) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload as { placeholder?: boolean; name?: string } | undefined;
    if (row?.placeholder || !row?.name) return null;
    const requests = Number(payload.find((p) => p.dataKey === 'requests')?.value ?? 0);
    const errors = Number(payload.find((p) => p.dataKey === 'errors')?.value ?? 0);
    return (
        <div className="pointer-events-none rounded-xl border border-border-subtle bg-bg-modal p-4 shadow-xl">
            <p className="mb-3 border-b border-border-subtle pb-2 text-sm font-semibold capitalize text-text-main">
                {label}
            </p>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-6">
                    <span className="text-sm text-text-muted">{requestsLabel}:</span>
                    <span className="text-sm font-bold text-text-main">
                        {requests.toLocaleString()}
                    </span>
                </div>
                {errors > 0 ? (
                    <div className="flex items-center justify-between gap-6">
                        <span className="text-sm text-text-muted">{errorsLabel}:</span>
                        <span className="text-sm font-bold text-text-main">
                            {errors.toLocaleString()}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

const CHART_H = 220;

export function AnalyticsTodayBarChart({ active, pieData }: AnalyticsTodayBarChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.todayChart;
    const requestsLabel = t.analytics.areaChart.requests;
    const errorsLabel = chart.errors;

    const chartData = useMemo(() => {
        const rows = pieData.map((d) => ({
            name: d.name,
            requests: d.value,
            errors: Number(d.errors) || 0,
            placeholder: false
        }));
        // Con 1–2 comandos la categoría de Recharts ocupa casi todo el ancho;
        // padding vacío limita el hover a la zona de la barra.
        if (rows.length > 0 && rows.length <= 2) {
            const pad = { name: '', requests: 0, errors: 0, placeholder: true };
            return [pad, ...rows, pad];
        }
        return rows;
    }, [pieData]);

    const realCount = pieData.length;
    const yAxis = evenYAxis(Math.max(0, ...pieData.map((d) => d.value)));
    const hasErrors = pieData.some((d) => (Number(d.errors) || 0) > 0);
    const chartRef = useStripRechartsTabIndex(active && realCount > 0, [chartData, active]);

    const barSize = realCount <= 2 ? 28 : realCount <= 5 ? 22 : 16;

    return (
        <AnalyticsSection
            className="col-span-1"
            panelClassName="flex flex-col"
            title={chart.title}
            info={chart.info}
        >
            {realCount === 0 ? (
                <div style={{ height: CHART_H }}>
                    <AnalyticsEmptyState
                        icon={BarChart2}
                        title={chart.noData}
                        description={chart.noDataSub}
                    />
                </div>
            ) : (
                <div ref={chartRef} className="w-full" style={{ height: CHART_H }}>
                    <ResponsiveContainer width="100%" height={CHART_H}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 14, right: 20, left: -8, bottom: 4 }}
                            barCategoryGap={realCount <= 2 ? '28%' : '32%'}
                            accessibilityLayer={false}
                        >
                            <CartesianGrid
                                stroke="var(--text-muted)"
                                strokeOpacity={0.14}
                                vertical
                                horizontal
                            />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="capitalize"
                                tickFormatter={(value) => (value ? String(value) : '')}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                allowDecimals={false}
                                domain={[0, yAxis.max]}
                                ticks={yAxis.ticks}
                                width={40}
                            />
                            <Tooltip
                                content={
                                    <CustomTooltip
                                        requestsLabel={requestsLabel}
                                        errorsLabel={errorsLabel}
                                    />
                                }
                                cursor={false}
                                isAnimationActive={false}
                                wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                            />
                            <Bar
                                dataKey="requests"
                                name={requestsLabel}
                                fill="var(--primary)"
                                fillOpacity={0.9}
                                radius={[4, 4, 0, 0]}
                                barSize={barSize}
                                maxBarSize={32}
                                isAnimationActive={active}
                                animationDuration={450}
                                activeBar={{
                                    fill: 'var(--primary)',
                                    fillOpacity: 1
                                }}
                            />
                            {hasErrors ? (
                                <Bar
                                    dataKey="errors"
                                    name={errorsLabel}
                                    fill="var(--color-error)"
                                    fillOpacity={0.85}
                                    radius={[4, 4, 0, 0]}
                                    barSize={Math.max(10, barSize - 10)}
                                    maxBarSize={22}
                                    isAnimationActive={active}
                                    animationDuration={450}
                                    activeBar={{
                                        fill: 'var(--color-error)',
                                        fillOpacity: 1
                                    }}
                                />
                            ) : null}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </AnalyticsSection>
    );
}
