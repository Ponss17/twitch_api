import React, { Suspense, useMemo, useEffect, useState } from 'react';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { AlertTriangle } from 'lucide-react';
import { fadeIn } from '@/core/utils/tw';
import { useRequiredSession } from '@/core/session/useSession';
import { buildLocalDateRange, getStatsLocalDateString } from '@/features/dashboard/lib/data/dashboardStats';
import { useTranslation } from '@/core/i18n/I18nContext';

import { AnalyticsKPIs, type AnalyticsTimeRange } from './AnalyticsKPIs';

const AnalyticsAreaChart = React.lazy(() =>
    import('./AnalyticsAreaChart').then((module) => ({ default: module.AnalyticsAreaChart }))
);
const AnalyticsViewerLeaderboard = React.lazy(() =>
    import('./AnalyticsViewerLeaderboard').then((module) => ({
        default: module.AnalyticsViewerLeaderboard
    }))
);
const AnalyticsLatencyChart = React.lazy(() =>
    import('./AnalyticsLatencyChart').then((module) => ({ default: module.AnalyticsLatencyChart }))
);
const AnalyticsTodayBarChart = React.lazy(() =>
    import('./AnalyticsTodayBarChart').then((module) => ({
        default: module.AnalyticsTodayBarChart
    }))
);

function AnalyticsViewContent({ active }: { active: boolean }) {
    const { stats, hasLiveData, error, profile } = useDashboardPanel();
    const { t } = useTranslation();
    const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('today');

    const { timeSeries = [] } = stats;

    const { areaData, pieDataPeriod, pieDataToday, summaryPeriod, summaryToday } = useMemo(() => {
        const todayDateStr = getStatsLocalDateString(profile?.timezone);
        const periodDays = timeRange === '30d' ? 30 : 7;
        const dailyMap = new Map<string, { date: string; requests: number; errors: number }>();
        const commandMapPeriod = new Map<string, { requests: number; errors: number; latency: number }>();
        const commandMapToday = new Map<string, { requests: number; errors: number; latency: number }>();

        let tRequests = 0;
        let tErrors = 0;
        let tLatency = 0;

        for (const dateStr of buildLocalDateRange(profile?.timezone, periodDays)) {
            dailyMap.set(dateStr, { date: dateStr, requests: 0, errors: 0 });
        }

        timeSeries.forEach((row) => {
            if (!dailyMap.has(row.date)) return;
            const day = dailyMap.get(row.date)!;
            day.requests += row.requests_count;
            day.errors += row.errors_count;

            const cmd = row.command_name === 'other' ? t.analytics.other : row.command_name;

            if (!commandMapPeriod.has(cmd)) {
                commandMapPeriod.set(cmd, { requests: 0, errors: 0, latency: 0 });
            }
            const cmdStatsP = commandMapPeriod.get(cmd)!;
            cmdStatsP.requests += row.requests_count;
            cmdStatsP.errors += row.errors_count;
            cmdStatsP.latency += row.latency_sum || 0;

            if (row.date === todayDateStr) {
                if (!commandMapToday.has(cmd)) {
                    commandMapToday.set(cmd, { requests: 0, errors: 0, latency: 0 });
                }
                const cmdStatsT = commandMapToday.get(cmd)!;
                cmdStatsT.requests += row.requests_count;
                cmdStatsT.errors += row.errors_count;
                cmdStatsT.latency += row.latency_sum || 0;

                tRequests += row.requests_count;
                tErrors += row.errors_count;
                tLatency += row.latency_sum || 0;
            }
        });

        const sortedArea = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        const pieDataPeriod = Array.from(commandMapPeriod.entries())
            .map(([name, s]) => ({
                name,
                value: s.requests,
                errors: s.errors,
                successRate: s.requests > 0 ? ((1 - s.errors / s.requests) * 100).toFixed(1) : '0.0',
                avgLatency: s.requests > 0 ? Math.round(s.latency / s.requests) : 0
            }))
            .sort((a, b) => b.value - a.value);

        const pieDataToday = Array.from(commandMapToday.entries())
            .map(([name, s]) => ({
                name,
                value: s.requests,
                errors: s.errors,
                successRate: s.requests > 0 ? ((1 - s.errors / s.requests) * 100).toFixed(1) : '0.0',
                avgLatency: s.requests > 0 ? Math.round(s.latency / s.requests) : 0
            }))
            .sort((a, b) => b.value - a.value);

        const totalRequestsPeriod = Array.from(commandMapPeriod.values()).reduce((sum, s) => sum + s.requests, 0);
        const totalErrorsPeriod = Array.from(commandMapPeriod.values()).reduce((sum, s) => sum + s.errors, 0);
        const totalLatencyPeriod = Array.from(commandMapPeriod.values()).reduce((sum, s) => sum + s.latency, 0);
        const avgLatencyPeriod = totalRequestsPeriod > 0 ? Math.round(totalLatencyPeriod / totalRequestsPeriod) : 0;
        const successRatePeriod = totalRequestsPeriod > 0 ? ((1 - totalErrorsPeriod / totalRequestsPeriod) * 100).toFixed(1) : '0.0';

        const todayAvgLatency = tRequests > 0 ? Math.round(tLatency / tRequests) : 0;
        const todaySuccessRate = tRequests > 0 ? ((1 - tErrors / tRequests) * 100).toFixed(1) : '0.0';

        return {
            areaData: sortedArea,
            pieDataPeriod,
            pieDataToday,
            summaryPeriod: {
                totalRequests: totalRequestsPeriod,
                successRate: successRatePeriod,
                avgLatency: avgLatencyPeriod,
                uniqueCommands: pieDataPeriod.length
            },
            summaryToday: {
                totalRequests: tRequests,
                avgLatency: todayAvgLatency,
                successRate: todaySuccessRate,
                uniqueCommands: pieDataToday.length
            }
        };
    }, [timeSeries, profile?.timezone, t.analytics.other, timeRange]);

    const todayRequestsCount = summaryToday.totalRequests;

    useEffect(() => {
        if (!active) return;
        const cleanTabIndex = () => {
            document
                .querySelectorAll(
                    '.recharts-wrapper [tabindex], .recharts-surface [tabindex], .recharts-wrapper g[tabindex]'
                )
                .forEach((el) => {
                    el.removeAttribute('tabindex');
                });
        };

        cleanTabIndex();
        const frame = requestAnimationFrame(cleanTabIndex);
        const t1 = window.setTimeout(cleanTabIndex, 50);
        const t2 = window.setTimeout(cleanTabIndex, 400);
        const mo = new MutationObserver(cleanTabIndex);
        mo.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['tabindex']
        });

        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            mo.disconnect();
        };
    }, [active, areaData, pieDataPeriod, pieDataToday, timeRange]);

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-error/[0.05] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const latencyDaily = summaryToday.avgLatency;
    const successRateDaily = parseFloat(summaryToday.successRate) || 0;

    const commandKeys = [
        'clips',
        'followage',
        'watchtime',
        'so',
        'stalker',
        'trends',
        'roulette',
        'russian',
        'magic8',
        'duel',
        'slots'
    ] as const;
    const uniqueCommandsDaily =
        pieDataToday.length > 0
            ? pieDataToday.length
            : commandKeys.filter((key) => (stats[key] ?? 0) > 0).length;

    const latencyPeriod = summaryPeriod.avgLatency ?? 0;
    const successRatePeriod = parseFloat(summaryPeriod.successRate) || 0;
    const requestsPeriod = summaryPeriod.totalRequests;
    const uniqueCommandsPeriod = summaryPeriod.uniqueCommands;

    const displayRequests = timeRange === 'today' ? todayRequestsCount : requestsPeriod;
    const displaySuccessRate = timeRange === 'today' ? successRateDaily : successRatePeriod;
    const displayLatency = timeRange === 'today' ? latencyDaily : latencyPeriod;
    const displayCommands = timeRange === 'today' ? uniqueCommandsDaily : uniqueCommandsPeriod;
    const displayPieData = timeRange === 'today' ? pieDataToday : pieDataPeriod;

    const isLoading = !hasLiveData;
    const requestsDuration = displayRequests === 0 ? 0 : active ? 400 : 0;
    const successDuration = active ? 1000 : 0;
    const latencyDuration = active ? 1000 : 0;

    return (
        <div className={`space-y-4 ${fadeIn}`}>
            <AnalyticsKPIs
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                isLoading={isLoading}
                displayRequests={displayRequests}
                displaySuccessRate={displaySuccessRate}
                displayLatency={displayLatency}
                displayCommands={displayCommands}
                requestsDuration={requestsDuration}
                successDuration={successDuration}
                latencyDuration={latencyDuration}
            />

            <Suspense fallback={null}>
                <div key={timeRange} className="space-y-4 animate-tab-in">
                    {timeRange === 'today' ? (
                        <AnalyticsTodayBarChart active={active} pieData={displayPieData} />
                    ) : (
                        <AnalyticsAreaChart active={active} areaData={areaData} />
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <AnalyticsViewerLeaderboard timeRange={timeRange} />
                        <AnalyticsLatencyChart pieData={displayPieData} />
                    </div>
                </div>
            </Suspense>
        </div>
    );
}

export function AnalyticsView({ active = true }: { active?: boolean }) {
    useRequiredSession();
    return <AnalyticsViewContent active={active} />;
}
