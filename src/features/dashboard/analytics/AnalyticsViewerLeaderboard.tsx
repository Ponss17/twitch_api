import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { VIEWER_ACTIVITY_TYPES } from '@contracts/commandCatalog';
import { AnalyticsSection, AnalyticsSimpleList, AnalyticsEmptyState } from './AnalyticsShared';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { useTranslation } from '@/core/i18n/I18nContext';

export interface ViewerLeaderboardEntry {
    user_name: string;
    total: number;
    last_seen: string;
}

interface AnalyticsViewerLeaderboardProps {
    timeRange: 'today' | '7d';
}

const VIEWER_TYPES = new Set<string>(VIEWER_ACTIVITY_TYPES);

export function AnalyticsViewerLeaderboard({ timeRange }: AnalyticsViewerLeaderboardProps) {
    const { activity, stats } = useDashboardPanel();
    const { t } = useTranslation();
    const board = t.analytics.leaderboard;

    const [todayMap, setTodayMap] = useState<Map<string, ViewerLeaderboardEntry>>(new Map());
    const [weeklyMap, setWeeklyMap] = useState<Map<string, ViewerLeaderboardEntry>>(new Map());
    const lastActivityTsRef = useRef<string | null>(null);

    useEffect(() => {
        const tMap = new Map<string, ViewerLeaderboardEntry>();
        for (const entry of stats.leaderboardToday || []) {
            tMap.set(entry.user_name.toLowerCase(), { ...entry });
        }
        setTodayMap(tMap);

        const wMap = new Map<string, ViewerLeaderboardEntry>();
        for (const entry of stats.leaderboardWeekly || []) {
            wMap.set(entry.user_name.toLowerCase(), { ...entry });
        }
        setWeeklyMap(wMap);

        if (activity.length > 0 && !lastActivityTsRef.current) {
            lastActivityTsRef.current = activity[0].timestamp || null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.leaderboardToday, stats.leaderboardWeekly]);

    useEffect(() => {
        if (!activity.length) return;
        const latest = activity[0];
        const ts = latest.timestamp ?? '';

        if (!ts || ts === lastActivityTsRef.current) return;
        lastActivityTsRef.current = ts;

        if (!latest.type || !VIEWER_TYPES.has(latest.type)) return;

        const rawName = latest.user?.trim();
        if (
            !rawName ||
            rawName === 'Anónimo' ||
            rawName === 'Streamer' ||
            rawName === 'Canal' ||
            rawName === 'Channel'
        ) {
            return;
        }

        const key = rawName.toLowerCase();

        const incrementMap = (map: Map<string, ViewerLeaderboardEntry>) => {
            const newMap = new Map(map);
            const existing = newMap.get(key);
            if (existing) {
                existing.total += 1;
                existing.last_seen = ts;
            } else {
                newMap.set(key, { user_name: rawName, total: 1, last_seen: ts });
            }
            return newMap;
        };

        setTodayMap(incrementMap);
        setWeeklyMap(incrementMap);
    }, [activity]);

    const activeMap = timeRange === 'today' ? todayMap : weeklyMap;
    const rows = useMemo(() => {
        return Array.from(activeMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 30)
            .map((entry) => ({
                id: entry.user_name.toLowerCase(),
                left: entry.user_name,
                right: entry.total.toLocaleString(),
                title: entry.user_name
            }));
    }, [activeMap]);

    return (
        <AnalyticsSection
            panelClassName="h-[270px] flex flex-col"
            title={board.title}
            info={timeRange === 'today' ? board.infoToday : board.info7d}
        >
            <AnalyticsSimpleList
                leftHeader={board.colUser}
                rightHeader={board.colUses}
                rows={rows}
                resetKey={timeRange}
                empty={
                    <AnalyticsEmptyState
                        icon={Users}
                        title={board.noData}
                        description={board.noDataSub}
                    />
                }
            />
        </AnalyticsSection>
    );
}
