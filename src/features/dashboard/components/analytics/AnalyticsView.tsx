import React, { useMemo, useEffect, useState } from 'react';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { AlertTriangle } from 'lucide-react';
import { fadeIn } from '@/core/ui/tw';
import { useRequiredSession } from '@/core/session/useSession';
import { getTodayRequestsTotal, getStatsLocalDateString } from '@/features/dashboard/lib/dashboardStats';

import { AnalyticsKPIs } from './AnalyticsKPIs';
import { AnalyticsAreaChart } from './AnalyticsAreaChart';
import { AnalyticsCommandsDistribution } from './AnalyticsCommandsDistribution';
import { AnalyticsEndpointsTable } from './AnalyticsEndpointsTable';
import { AnalyticsLatencyChart } from './AnalyticsLatencyChart';
import { AnalyticsTodayBarChart } from './AnalyticsTodayBarChart';

function AnalyticsViewContent({ active }: { active: boolean }) {
    const { stats, hasLiveData, error, profile } = useDashboardPanel();
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

        // Pre-fill last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dailyMap.set(dateStr, { date: dateStr, requests: 0, errors: 0 });
        }

        timeSeries.forEach((row) => {
            if (dailyMap.has(row.date)) {
                const day = dailyMap.get(row.date)!;
                day.requests += row.requests_count;
                day.errors += row.errors_count;
            }

            const cmd = row.command_name === 'other' ? 'Otros' : row.command_name;
            
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
            summaryWeekly: { totalRequests: totalRequestsWeekly, successRate: successRateWeekly, avgLatency: avgLatencyWeekly, uniqueCommands: pieDataWeekly.length },
            summaryToday: { totalRequests: tRequests, avgLatency: todayAvgLatency, successRate: todaySuccessRate, uniqueCommands: pieDataToday.length }
        };
    }, [timeSeries, profile?.timezone]);

    // Fix agresivo para Astro DevToolbar
    useEffect(() => {
        if (!active) return;
        const cleanTabIndex = () => {
            document.querySelectorAll('.recharts-wrapper [tabindex]').forEach(el => {
                el.removeAttribute('tabindex');
            });
        };
        
        cleanTabIndex();
        const interval = setInterval(cleanTabIndex, 100);
        const timeout = setTimeout(() => clearInterval(interval), 2000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [active, areaData, pieDataWeekly, pieDataToday]);

    if (error && !hasLiveData) {
        return (
            <div className="rounded-xl border border-error/30 bg-[#0f0f11] p-6 text-error">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        );
    }

    const todayRequests = getTodayRequestsTotal(stats);
    const latencyDaily = summaryToday.avgLatency;
    const successRateDaily = parseFloat(summaryToday.successRate) || 0;
    
    const commandKeys = ['clips', 'followage', 'so', 'message', 'stalker', 'trends', 'roulette', 'russian', 'magic8', 'duel'] as const;
    const uniqueCommandsDaily = commandKeys.filter(key => (stats[key] ?? 0) > 0).length;

    const latencyWeekly = summaryWeekly.avgLatency ?? 0;
    const successRateWeekly = parseFloat(summaryWeekly.successRate) || 0;
    const requestsWeekly = summaryWeekly.totalRequests;
    const uniqueCommandsWeekly = summaryWeekly.uniqueCommands;

    const displayRequests = timeRange === 'today' ? todayRequests : requestsWeekly;
    const displaySuccessRate = timeRange === 'today' ? successRateDaily : successRateWeekly;
    const displayLatency = timeRange === 'today' ? latencyDaily : latencyWeekly;
    const displayCommands = timeRange === 'today' ? uniqueCommandsDaily : uniqueCommandsWeekly;
    const displayPieData = timeRange === 'today' ? pieDataToday : pieDataWeekly;
    const displayPieTotal = timeRange === 'today' ? summaryToday.totalRequests : summaryWeekly.totalRequests;

    const isLoading = !hasLiveData;
    const requestsDuration = displayRequests === 0 ? 0 : active ? 400 : 0;
    const successDuration = active ? 1000 : 0;
    const latencyDuration = active ? 1000 : 0;

    return (
        <div className={`space-y-6 ${fadeIn}`}>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {timeRange === 'today' ? (
                    <AnalyticsTodayBarChart active={active} pieData={displayPieData} />
                ) : (
                    <AnalyticsAreaChart active={active} areaData={areaData} />
                )}
                <AnalyticsCommandsDistribution active={active} pieData={displayPieData} totalRequests={displayPieTotal} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AnalyticsEndpointsTable pieData={displayPieData} />
                <AnalyticsLatencyChart active={active} pieData={displayPieData} />
            </div>
        </div>
    );
}

export function AnalyticsView({ active = true }: { active?: boolean }) {
    useRequiredSession();
    return <AnalyticsViewContent active={active} />;
}
