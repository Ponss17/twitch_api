import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { AnalyticsSection } from './AnalyticsShared';
import { API_ENDPOINTS } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import { useRequiredSession } from '@/core/session/useSession';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

export interface ViewerLeaderboardEntry {
    user_name: string;
    total: number;
    last_seen: string;
}

interface AnalyticsViewerLeaderboardProps {
    timeRange: 'today' | '7d';
}

const ANALYTICS_COLORS = ['#7254b8', '#4a8b75', '#b3934d', '#b35656', '#4d75b3', '#b3714d', '#a85c87', '#615e9c'];

// Fuera del componente: se crea una sola vez, no en cada render
const VIEWER_TYPES = new Set(['followage', 'clip', 'shoutout', 'magic8', 'russian', 'duel']);

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
    const session = useRequiredSession();
    const { activity } = useDashboardPanel();
    const [data, setData] = useState<ViewerLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Guardamos el timestamp del último item procesado para no re-fetchear si no hay items genuinamente nuevos
    const lastActivityTsRef = useRef<string | null>(null);

    const fetchLeaderboard = useCallback(async (showLoader = false) => {
        if (!session) return;
        if (showLoader) setLoading(true);
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

    // Carga inicial
    useEffect(() => {
        fetchLeaderboard(true);
    }, [fetchLeaderboard]);

    // Realtime: cuando llega actividad nueva de tipo viewer, refrescar con debounce
    useEffect(() => {
        if (!activity.length) return;
        const latest = activity[0];
        if (!latest?.type || !VIEWER_TYPES.has(latest.type)) return;

        // Evitar re-fetch si el item no cambió (el array se puede re-crear sin items nuevos)
        const ts = latest.timestamp ?? '';
        if (ts && ts === lastActivityTsRef.current) return;
        lastActivityTsRef.current = ts;

        // Debounce de 2s para no spamear el API si llegan varios eventos seguidos
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            void fetchLeaderboard(false);
        }, 2000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity]);

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

                    <LazyMotion features={domAnimation}>
                        <AnimatePresence mode="popLayout">
                            {data.map((entry, idx) => {
                                const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
                                const rowColor = ANALYTICS_COLORS[idx % ANALYTICS_COLORS.length];

                                return (
                                    <m.div
                                        key={entry.user_name}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                        className="flex flex-col gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <RankIcon rank={idx} color={rowColor} />
                                            <span
                                                className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200"
                                                title={entry.user_name}
                                            >
                                                {entry.user_name}
                                            </span>
                                            <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-300">
                                                {entry.total}
                                                <span className="ml-1 font-normal text-zinc-600">
                                                    {entry.total === 1 ? 'uso' : 'usos'}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Barra de progreso relativa al primero */}
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                            <div
                                                className="h-full rounded-full transition-[width] duration-700"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: rowColor,
                                                    boxShadow: `0 0 10px ${rowColor}40`
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
