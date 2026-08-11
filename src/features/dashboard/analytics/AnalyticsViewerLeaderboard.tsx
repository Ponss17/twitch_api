import React, { useEffect, useState, useRef } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { VIEWER_ACTIVITY_TYPES } from '@contracts/commandCatalog';
import { AnalyticsSection, COLORS } from './AnalyticsShared';
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

function RankIcon({ rank, color }: { rank: number; color: string }) {
    return (
        <span
            className="w-5 shrink-0 text-center text-sm font-bold"
            style={{ color }}
        >
            #{rank + 1}
        </span>
    );
}

export function AnalyticsViewerLeaderboard({ timeRange }: AnalyticsViewerLeaderboardProps) {
    const { activity, stats } = useDashboardPanel();
    const { t } = useTranslation();
    const board = t.analytics.leaderboard;

    const [todayMap, setTodayMap] = useState<Map<string, ViewerLeaderboardEntry>>(new Map());
    const [weeklyMap, setWeeklyMap] = useState<Map<string, ViewerLeaderboardEntry>>(new Map());
    const lastActivityTsRef = useRef<string | null>(null);

    // 1. Inicializar mapas base desde los stats globales cargados una sola vez (getSummary)
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
        
        // Guardamos el TS inicial para no procesar actividad que ya venía en el payload inicial
        if (activity.length > 0 && !lastActivityTsRef.current) {
            lastActivityTsRef.current = activity[0].timestamp || null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.leaderboardToday, stats.leaderboardWeekly]);

    // 2. Parchear en tiempo real (100% en memoria, sin latencia de red)
    useEffect(() => {
        if (!activity.length) return;
        const latest = activity[0];
        const ts = latest.timestamp ?? '';

        if (!ts || ts === lastActivityTsRef.current) return;
        lastActivityTsRef.current = ts;

        if (!latest.type || !VIEWER_TYPES.has(latest.type)) return;
        
        const rawName = latest.user?.trim();
        if (!rawName || rawName === 'Anónimo' || rawName === 'Streamer' || rawName === 'Canal' || rawName === 'Channel') return;

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

    // 3. Proyectar el mapa a Array y ordenar (solo top 10)
    const activeMap = timeRange === 'today' ? todayMap : weeklyMap;
    const allEntries = Array.from(activeMap.values());
    const data = allEntries
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    const maxTotal = data[0]?.total ?? 1;
    const totalInteractions = allEntries.reduce((sum, entry) => sum + entry.total, 0);

    return (
        <AnalyticsSection
            panelClassName="h-full min-h-[360px] flex flex-col"
            title={board.title}
            info={timeRange === 'today' ? board.infoToday : board.info7d}
        >
            {data.length === 0 ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-transparent">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-6 w-6 text-brand-text" />
                    </div>
                    <span className="text-sm font-medium text-text-muted">{board.noData}</span>
                    <span className="mt-1 text-xs text-text-muted">
                        {board.noDataSub}
                    </span>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Header */}
                    <div className="mb-1 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-3.5 w-3.5 text-brand-text" />
                            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted">
                                {timeRange === 'today' ? board.rankingToday : board.ranking7d}
                            </span>
                        </div>
                        <span className="text-[0.7rem] font-medium text-text-muted" title={board.totalInteractionsTooltip}>
                            <strong className="text-text-main">{totalInteractions}</strong> {board.totalInteractions}
                        </span>
                    </div>

                    <LazyMotion features={domAnimation}>
                        <AnimatePresence mode="popLayout">
                            {data.map((entry, idx) => {
                                const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
                                const rowColor = COLORS[idx % COLORS.length];

                                return (
                                    <m.div
                                        key={entry.user_name}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                        className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 transition-colors hover:bg-bg-secondary/80"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <RankIcon rank={idx} color={rowColor} />
                                            <span
                                                className="min-w-0 flex-1 truncate text-sm font-medium text-text-main"
                                                title={entry.user_name}
                                            >
                                                {entry.user_name}
                                            </span>
                                            <span className="shrink-0 text-xs font-bold tabular-nums text-text-main">
                                                {entry.total}
                                                <span className="ml-1 font-normal text-text-muted">
                                                    {entry.total === 1 ? board.unitSingular : board.unitPlural}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Barra de progreso relativa al primero */}
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-strong">
                                            <div
                                                className="h-full rounded-full transition-[width] duration-700"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: rowColor
                                                }}
                                            />
                                        </div>
                                    </m.div>
                                );
                            })}
                        </AnimatePresence>
                    </LazyMotion>
                </div>
            )}
        </AnalyticsSection>
    );
}
