import React, { Suspense, useMemo, useEffect, useState } from 'react';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { AlertTriangle } from 'lucide-react';
import { fadeIn } from '@/core/utils/tw';
import { useRequiredSession } from '@/core/session/useSession';
import { buildLocalDateRange, getStatsLocalDateString } from '@/features/dashboard/lib/dashboardStats';
import { useTranslation } from '@/core/i18n/I18nContext';

import { AnalyticsKPIs } from './AnalyticsKPIs';

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
    const [timeRange, setTimeRange] = useState<'today' | '7d'>('today');

    const { timeSeries = [] } = stats;

    const { areaData, pieDataWeekly, pieDataToday, summaryWeekly, summaryToday } = useMemo(() => {
        const todayDateStr = getStatsLocalDateString(profile?.timezone);
        const dailyMap = new Map<string, { date: string; requests: number; errors: number }>();
        const commandMapWeekly = new Map<string, { requests: number; errors: number; latency: number }>();
        const commandMapToday = new Map<string, { requests: number; errors: number; latency: number }>();

        let tRequests = 0;
        let tErrors = 0;
        let tLatency = 0;

        for (const dateStr of buildLocalDateRange(profile?.timezone, 7)) {
            dailyMap.set(dateStr, { date: dateStr, requests: 0, errors: 0 });
        }

        timeSeries.forEach((row) => {
            if (!dailyMap.has(row.date)) return;
            const day = dailyMap.get(row.date)!;
            day.requests += row.requests_count;
            day.errors += row.errors_count;

            const cmd = row.command_name === 'other' ? t.analytics.other : row.command_name;

            if (!commandMapWeekly.has(cmd)) {
                commandMapWeekly.set(cmd, { requests: 0, errors: 0, latency: 0 });
            }
            const cmdStatsW = commandMapWeekly.get(cmd)!;
            cmdStatsW.requests += row.requests_count;
            cmdStatsW.errors += row.errors_count;
            cmdStatsW.latency += row.latency_sum || 0;

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

        const pieDataWeekly = Array.from(commandMapWeekly.entries())
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

        const totalRequestsWeekly = Array.from(commandMapWeekly.values()).reduce((sum, s) => sum + s.requests, 0);
        const totalErrorsWeekly = Array.from(commandMapWeekly.values()).reduce((sum, s) => sum + s.errors, 0);
        const totalLatencyWeekly = Array.from(commandMapWeekly.values()).reduce((sum, s) => sum + s.latency, 0);
        const avgLatencyWeekly = totalRequestsWeekly > 0 ? Math.round(totalLatencyWeekly / totalRequestsWeekly) : 0;
        const successRateWeekly = totalRequestsWeekly > 0 ? ((1 - totalErrorsWeekly / totalRequestsWeekly) * 100).toFixed(1) : '0.0';

        const todayAvgLatency = tRequests > 0 ? Math.round(tLatency / tRequests) : 0;
        const todaySuccessRate = tRequests > 0 ? ((1 - tErrors / tRequests) * 100).toFixed(1) : '0.0';

        return {
            areaData: sortedArea,
            pieDataWeekly,
            pieDataToday,
            summaryWeekly: {
                totalRequests: totalRequestsWeekly,
                successRate: successRateWeekly,
                avgLatency: avgLatencyWeekly,
                uniqueCommands: pieDataWeekly.length
            },
            summaryToday: {
                totalRequests: tRequests,
                avgLatency: todayAvgLatency,
                successRate: todaySuccessRate,
                uniqueCommands: pieDataToday.length
            }
        };
    }, [timeSeries, profile?.timezone, t.analytics.other]);

    const todayRequestsCount = summaryToday.totalRequests;

    useEffect(() => {
        if (!active) return;
        const cleanTabIndex = () => {
            document.querySelectorAll('.recharts-wrapper [tabindex]').forEach((el) => {
                el.removeAttribute('tabindex');
            });
        };

        const frame = requestAnimationFrame(() => {
            cleanTabIndex();
            setTimeout(cleanTabIndex, 50);
        });

        return () => cancelAnimationFrame(frame);
    }, [active, areaData, pieDataWeekly, pieDataToday]);

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
        'message',
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

    const latencyWeekly = summaryWeekly.avgLatency ?? 0;
    const successRateWeekly = parseFloat(summaryWeekly.successRate) || 0;
    const requestsWeekly = summaryWeekly.totalRequests;
    const uniqueCommandsWeekly = summaryWeekly.uniqueCommands;

    const displayRequests = timeRange === 'today' ? todayRequestsCount : requestsWeekly;
    const displaySuccessRate = timeRange === 'today' ? successRateDaily : successRateWeekly;
    const displayLatency = timeRange === 'today' ? latencyDaily : latencyWeekly;
    const displayCommands = timeRange === 'today' ? uniqueCommandsDaily : uniqueCommandsWeekly;
    const displayPieData = timeRange === 'today' ? pieDataToday : pieDataWeekly;

    const isLoading = !hasLiveData;
    const requestsDuration = displayRequests === 0 ? 0 : active ? 400 : 0;
    const successDuration = active ? 1000 : 0;
    const latencyDuration = active ? 1000 : 0;

    return (
        <div className={`space-y-5 ${fadeIn}`}>
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
                {timeRange === 'today' ? (
                    <AnalyticsTodayBarChart active={active} pieData={displayPieData} />
                ) : (
                    <AnalyticsAreaChart active={active} areaData={areaData} />
                )}

                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <AnalyticsViewerLeaderboard timeRange={timeRange} />
                    <AnalyticsLatencyChart active={active} pieData={displayPieData} />
                </div>
            </Suspense>
        </div>
    );
}

export function AnalyticsView({ active = true }: { active?: boolean }) {
    useRequiredSession();
    return <AnalyticsViewContent active={active} />;
}
