import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Activity } from 'lucide-react';
import { ChartMountGate, AnalyticsSection, AnalyticsEmptyState } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';

interface AnalyticsAreaChartProps {
    active: boolean;
    areaData: Array<{ date: string; requests: number; errors: number }>;
}

type HoverTip = {
    x: number;
    y: number;
    label: string;
    requests: number;
    errors: number;
};

function formatChartDate(value: unknown): string {
    if (typeof value !== 'string' || !value.includes('-')) return String(value ?? '');
    const [, month, day] = value.split('-');
    if (!month || !day) return value;
    return `${day}/${month}`;
}

function evenYAxis(dataMax: number): { max: number; ticks: number[] } {
    if (!Number.isFinite(dataMax) || dataMax <= 1) {
        return { max: 10, ticks: [0, 2, 4, 6, 8, 10] };
    }
    let max = Math.ceil(dataMax * 1.12);
    if (max < 4) max = 4;
    while (max % 4 !== 0) max += 1;
    const step = max / 4;
    return {
        max,
        ticks: [0, step, step * 2, step * 3, max]
    };
}

function SeriesLegend({ requestsLabel, errorsLabel }: { requestsLabel: string; errorsLabel: string }) {
    return (
        <div className="flex items-center gap-3 text-[0.7rem] font-medium text-text-muted">
            <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                {requestsLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-error" aria-hidden />
                {errorsLabel}
            </span>
        </div>
    );
}

export function AnalyticsAreaChart({ active, areaData }: AnalyticsAreaChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.areaChart;
    const wrapRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<HoverTip | null>(null);

    const peak = useMemo(
        () => Math.max(0, ...areaData.flatMap((d) => [Number(d.requests) || 0, Number(d.errors) || 0])),
        [areaData]
    );
    const yAxis = evenYAxis(peak);
    const hasSeries = areaData.length > 0;

    const handleMouseMove = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state: any) => {
            const coordinate = state?.activeCoordinate;
            const index = state?.activeIndex;
            if (coordinate == null || index == null) {
                setHover(null);
                return;
            }
            const i = typeof index === 'number' ? index : Number(index);
            const row = Number.isFinite(i) ? areaData[i] : null;
            if (!row) {
                setHover(null);
                return;
            }
            setHover({
                x: Number(coordinate.x) || 0,
                y: Number(coordinate.y) || 0,
                label: String(row.date ?? state.activeLabel ?? ''),
                requests: Number(row.requests) || 0,
                errors: Number(row.errors) || 0
            });
        },
        [areaData]
    );

    const clearHover = useCallback(() => setHover(null), []);

    const tipStyle = useMemo(() => {
        if (!hover) return null;
        const width = wrapRef.current?.clientWidth ?? 0;
        const tipW = 168;
        const left = width > 0 ? Math.min(Math.max(8, hover.x + 14), width - tipW - 8) : hover.x + 14;
        const top = Math.max(8, hover.y - 72);
        return { left, top };
    }, [hover]);

    return (
        <AnalyticsSection
            panelClassName="h-[320px]"
            title={chart.title}
            info={chart.info}
            action={<SeriesLegend requestsLabel={chart.requests} errorsLabel={chart.errors} />}
        >
            {!hasSeries ? (
                <AnalyticsEmptyState
                    icon={Activity}
                    title={chart.noData}
                    description={chart.noDataSub}
                />
            ) : (
                <ChartMountGate
                    active={active}
                    className="relative min-h-[220px] w-full min-w-0 flex-1 overflow-hidden"
                    srLabel={chart.title}
                >
                    <div ref={wrapRef} className="relative h-full w-full min-h-0 min-w-0">
                        {hover && tipStyle ? (
                            <>
                                <div
                                    className="pointer-events-none absolute top-3 bottom-6 z-10 w-px bg-primary/45"
                                    style={{ left: hover.x }}
                                    aria-hidden
                                />
                                <div
                                    className="pointer-events-none absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-panel bg-primary"
                                    style={{ left: hover.x, top: hover.y }}
                                    aria-hidden
                                />
                                <div
                                    className="pointer-events-none absolute z-20 w-[10.5rem] rounded-lg border border-border-subtle bg-bg-panel px-3 py-2"
                                    style={tipStyle}
                                >
                                    <p className="mb-2 text-[0.8rem] font-semibold text-text-main">
                                        {formatChartDate(hover.label)}
                                    </p>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                                            <span className="text-[0.8rem] text-text-muted">
                                                <span className="font-semibold tabular-nums text-text-main">
                                                    {hover.requests.toLocaleString()}
                                                </span>
                                                {` ${chart.requests.toLowerCase()}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 shrink-0 rounded-full bg-error" aria-hidden />
                                            <span className="text-[0.8rem] text-text-muted">
                                                <span className="font-semibold tabular-nums text-text-main">
                                                    {hover.errors.toLocaleString()}
                                                </span>
                                                {` ${chart.errors.toLowerCase()}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}

                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart
                                data={areaData}
                                margin={{ top: 14, right: 20, left: -8, bottom: 4 }}
                                accessibilityLayer={false}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={clearHover}
                            >
                                <defs>
                                    <linearGradient id="lpTrafficFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="lpErrorsFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-error)" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="var(--color-error)" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    stroke="var(--text-muted)"
                                    strokeOpacity={0.14}
                                    vertical={true}
                                    horizontal={true}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tickFormatter={formatChartDate}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, yAxis.max]}
                                    ticks={yAxis.ticks}
                                    allowDecimals={false}
                                    tickMargin={10}
                                    width={40}
                                />
                                <Tooltip cursor={false} content={() => null} wrapperStyle={{ display: 'none' }} />
                                <Area
                                    type="monotone"
                                    dataKey="requests"
                                    name={chart.requests}
                                    stroke="var(--primary)"
                                    strokeWidth={2.25}
                                    connectNulls
                                    activeDot={false}
                                    dot={false}
                                    fill="url(#lpTrafficFill)"
                                    baseValue={0}
                                    isAnimationActive={false}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="errors"
                                    name={chart.errors}
                                    stroke="var(--color-error)"
                                    strokeWidth={1.75}
                                    connectNulls
                                    activeDot={false}
                                    dot={false}
                                    fill="url(#lpErrorsFill)"
                                    baseValue={0}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartMountGate>
            )}
        </AnalyticsSection>
    );
}
