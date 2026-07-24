import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Users, Medal } from 'lucide-react';
import { AnalyticsSection } from './AnalyticsShared';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';

export interface ViewerLeaderboardEntry {
    user_name: string;
    total: number;
    last_seen: string;
}

interface AnalyticsViewerLeaderboardProps {
    timeRange: 'today' | '7d';
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_BG = [
    'border-[#FFD700]/20 bg-[#FFD700]/[0.04]',
    'border-[#C0C0C0]/20 bg-[#C0C0C0]/[0.04]',
    'border-[#CD7F32]/20 bg-[#CD7F32]/[0.04]',
];

function RankIcon({ rank }: { rank: number }) {
    if (rank < 3) {
        return (
            <Medal
                className="h-4 w-4 shrink-0"
                style={{ color: MEDAL_COLORS[rank] }}
            />
        );
    }
    return (
        <span className="w-4 shrink-0 text-center text-xs font-bold text-zinc-500">
            {rank + 1}
        </span>
    );
}

export function AnalyticsViewerLeaderboard({ timeRange }: AnalyticsViewerLeaderboardProps) {
    const session = useRequiredSession();
    const [data, setData] = useState<ViewerLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        try {
            const result = await apiFetch<ViewerLeaderboardEntry[]>(
                `${API_ENDPOINTS.VIEWER_LEADERBOARD}?range=${timeRange}&limit=10`,
                session,
                {},
                { logoutOn401: false }
            );
            setData(Array.isArray(result) ? result : []);
        } catch {
            setError('No se pudieron cargar los viewers.');
        } finally {
            setLoading(false);
        }
    }, [session, timeRange]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const maxTotal = data[0]?.total ?? 1;

    return (
        <AnalyticsSection
            panelClassName="min-h-[360px]"
            title="Viewers más activos"
            info={`Viewers que más usaron comandos ${timeRange === 'today' ? 'hoy' : 'esta semana'}.`}
        >
            {loading ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-10 w-full animate-pulse rounded-lg bg-white/[0.04]"
                            style={{ opacity: 1 - i * 0.15 }}
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-red-500/20 bg-red-500/[0.02]">
                    <span className="text-sm text-red-400">{error}</span>
                </div>
            ) : data.length === 0 ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Users className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">Sin actividad de viewers</span>
                    <span className="mt-1 text-xs text-zinc-500">
                        Los viewers aparecerán aquí al usar comandos
                    </span>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Header */}
                    <div className="mb-1 flex items-center gap-2 px-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-500">
                            Ranking {timeRange === 'today' ? 'de hoy' : 'semanal'}
                        </span>
                    </div>

                    {data.map((entry, idx) => {
                        const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
                        const isTop3 = idx < 3;

                        return (
                            <div
                                key={entry.user_name}
                                className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2 transition-colors ${
                                    isTop3 ? RANK_BG[idx] : 'border-white/[0.05] bg-white/[0.02]'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <RankIcon rank={idx} />
                                    <span
                                        className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-zinc-200"
                                        title={entry.user_name}
                                    >
                                        {entry.user_name}
                                    </span>
                                    <span
                                        className={`shrink-0 text-xs font-bold tabular-nums ${
                                            isTop3 ? 'text-white' : 'text-zinc-400'
                                        }`}
                                    >
                                        {entry.total}
                                        <span className="ml-1 font-normal text-zinc-600">
                                            {entry.total === 1 ? 'uso' : 'usos'}
                                        </span>
                                    </span>
                                </div>

                                {/* Barra de progreso relativa al primero */}
                                <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: isTop3
                                                ? MEDAL_COLORS[idx]
                                                : '#71717a',
                                            opacity: isTop3 ? 0.7 : 0.4
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
