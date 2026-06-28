import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS } from '@/lib/config';
import { authHeaders } from '@/lib/auth';
import { useRequiredSession } from '@/hooks/useSession';
import { useTmiChat } from '@/hooks/useTmiChat';
import { chatLogStore } from '@/lib/chatLogStore';
import { TabSyncService } from '@/lib/tabSyncService';
import { card, fadeIn } from '@/lib/tw';
import { useToast } from '@/components/ui/ToastProvider';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { CardHeaderIcon, EmptyStateIcon, InlineIcon } from '@/components/ui/Icon';
import { Circle, Power, Loader2, Network, BarChart2, Minus, Plus, Play, Clock, RotateCw } from 'lucide-react';


const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del',
    'a', 'al', 'con', 'para', 'por', 'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'como', 'cómo', 'cuando', 'cuándo', 'donde',
    'dónde', 'quien', 'quién', 'solo', 'sólo', 'tan', 'muy', 'mucho', 'poco', 'más', 'menos', 'http', 'https',
    'www', 'com'
]);

const LISTENER_ID = 'trends';

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    return `${m}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function TrackerRow({
    word,
    count,
    index,
    maxCount
}: {
    word: string;
    count: number;
    index: number;
    maxCount: number;
}) {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    const rankClass =
        index === 0
            ? 'bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent'
            : index === 1
              ? 'bg-gradient-to-r from-[rgba(192,192,192,0.1)] to-transparent'
              : index === 2
                ? 'bg-gradient-to-r from-[rgba(205,127,50,0.1)] to-transparent'
                : '';

    return (
        <tr className={`animate-fade-soft transition hover:bg-white/[0.02] ${rankClass}`}>
            <td className="border-b border-white/[0.03] px-5 py-3 align-middle">
                <span className="inline-block text-[1.2rem]">{medal}</span>
            </td>
            <td className="word-text border-b border-white/[0.03] px-5 py-3 align-middle text-[0.8125rem] font-semibold tracking-[0.5px]">
                {word}
            </td>
            <td className="count-text border-b border-white/[0.03] px-5 py-3 text-right align-middle font-[Consolas,monospace] text-[0.9375rem] opacity-90">
                {count}
            </td>
            <td className="border-b border-white/[0.03] px-5 py-3 align-middle">
                <div className="h-2 w-full overflow-hidden rounded bg-white/5">
                    <div
                        className="h-full rounded bg-gradient-to-r from-primary to-[#db2777] shadow-[0_0_10px_rgba(145,70,255,0.4)] transition-[width] duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                </div>
            </td>
        </tr>
    );
}

export function TrendsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [minutes, setMinutes] = useState(5);
    const durationMinutesRef = useRef(5);
    const [tracking, setTracking] = useState(false);
    const [connected, setConnected] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [timerEnded, setTimerEnded] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [isLeader, setIsLeader] = useState(false);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

    const wordCountsRef = useRef(wordCounts);
    wordCountsRef.current = wordCounts;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncRef = useRef<TabSyncService | null>(null);
    const trackingRef = useRef(tracking);
    trackingRef.current = tracking;
    const endTimerRef = useRef<(fromError?: boolean) => void>(() => {});
    const completeTimerRef = useRef<() => void>(() => {});
    const remainingTickRef = useRef(0);
    const runTimerRef = useRef<(seconds: number) => void>(() => {});
    const localEndTimerRef = useRef<(fromError?: boolean) => void>(() => {});
    const localResetRef = useRef<() => void>(() => {});
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    const displayName = session.displayName ?? session.login ?? 'Canal';

    const adjustMinutes = useCallback((delta: number) => {
        setMinutes((prev) => {
            const next = Math.min(60, Math.max(1, prev + delta));
            durationMinutesRef.current = next;
            return next;
        });
    }, []);

    const applyMinutesInput = useCallback((raw: string) => {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;
        const next = Math.min(60, Math.max(1, parsed));
        durationMinutesRef.current = next;
        setMinutes(next);
    }, []);

    const processMessage = useCallback((msg: string, username: string) => {
        chatLogStore.add(username, msg);
        const firstWord = msg
            .toLowerCase()
            .split(/\s+/)[0]
            ?.replace(/[^\wñáéíóúü]/g, '');
        if (firstWord && firstWord.length > 2 && !STOP_WORDS.has(firstWord)) {
            setWordCounts((prev) => {
                const next = { ...prev, [firstWord]: (prev[firstWord] || 0) + 1 };
                if (syncRef.current?.getIsLeader()) {
                    syncRef.current.broadcast('TRENDS_UPDATE_COUNTS', { counts: next });
                }
                return next;
            });
        }
    }, []);

    const updateStatus = useCallback((isConnected: boolean) => {
        setConnected(isConnected);
    }, []);

    const handleChatMessage = useCallback(
        (_ch: string, tags: { username?: string }, message: string) => {
            if (!trackingRef.current) return;
            const username = tags.username;
            if (!username || IGNORED_BOTS.has(username.toLowerCase())) return;
            processMessage(message, username);
        },
        [processMessage]
    );

    useTmiChat(LISTENER_ID, {
        channel: session.login,
        session,
        enabled: active && tracking && isLeader,
        onMessage: handleChatMessage,
        onConnected: () => updateStatus(true),
        onError: () => {
            updateStatus(false);
            showToast('Error al conectar con el chat', 'error');
            endTimerRef.current(true);
        }
    });

    useEffect(() => {
        if (!(active && tracking && isLeader)) {
            updateStatus(false);
        }
    }, [active, tracking, isLeader, updateStatus]);

    const localEndTimer = useCallback(
        (fromError = false) => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            remainingTickRef.current = 0;
            setTracking(false);
            setTimerEnded(true);
            updateStatus(false);

            if (!fromError) {
                const entries = Object.entries(wordCountsRef.current);
                if (entries.length > 0) {
                    const sorted = entries.sort((a, b) => b[1] - a[1]);
                    showToast(`Ganador: "${sorted[0][0]}" (${sorted[0][1]})`, 'success');
                } else {
                    showToast('¡Tiempo terminado!', 'success');
                }
            }
            setMinutes(durationMinutesRef.current);
        },
        [showToast, updateStatus]
    );

    endTimerRef.current = localEndTimer;
    localEndTimerRef.current = localEndTimer;

    const endTimer = useCallback(() => {
        syncRef.current?.broadcast('TRENDS_END', null);
        localEndTimer();
    }, [localEndTimer]);

    completeTimerRef.current = endTimer;

    const runTimer = useCallback((seconds: number) => {
        remainingTickRef.current = seconds;
        setRemaining(seconds);
        setTimerEnded(false);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (remainingTickRef.current <= 1) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                remainingTickRef.current = 0;
                setRemaining(0);
                if (syncRef.current?.getIsLeader()) {
                    completeTimerRef.current();
                }
                return;
            }
            remainingTickRef.current -= 1;
            setRemaining(remainingTickRef.current);
        }, 1000);
    }, []);

    runTimerRef.current = runTimer;

    const localReset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        remainingTickRef.current = 0;
        setTracking(false);
        setTimerEnded(false);
        setSessionActive(false);
        setRemaining(0);
        setWordCounts({});
        setMinutes(durationMinutesRef.current);
        chatLogStore.clear();
        updateStatus(false);
    }, [updateStatus]);

    const reset = useCallback(() => {
        syncRef.current?.broadcast('TRENDS_RESET', null);
        localReset();
    }, [localReset]);

    localResetRef.current = localReset;

    const startTracking = useCallback(async () => {
        if (trackingRef.current) return;

        durationMinutesRef.current = minutes;
        syncRef.current?.broadcast('TRENDS_START', minutes);
        setTracking(true);
        setSessionActive(true);
        setWordCounts({});
        chatLogStore.clear();

        if (syncRef.current?.getIsLeader()) {
            void fetch(`${API_ENDPOINTS.BASE}/dashboard/track-usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ tool: 'trends' })
            }).catch(() => {});
        }

        runTimer(minutes * 60);
        showToast(`Tracker iniciado (${minutes} min)`, 'success');
    }, [minutes, session, runTimer, showToast]);

    useEffect(() => {
        if (!active) {
            localResetRef.current();
            setIsLeader(false);
            if (syncRef.current) {
                syncRef.current.destroy();
                syncRef.current = null;
            }
            return;
        }

        const sync = new TabSyncService('dashboard_trends_sync');
        syncRef.current = sync;

        sync.on('TRENDS_START', (payload) => {
            const mins = payload as number;
            durationMinutesRef.current = mins;
            setMinutes(mins);
            setTracking(true);
            setSessionActive(true);
            setWordCounts({});
            chatLogStore.clear();
            runTimerRef.current(mins * 60);
            if (!sync.getIsLeader()) {
                showToastRef.current(`Tracker iniciado (${mins} min)`, 'success');
            }
        });

        sync.on('TRENDS_UPDATE_COUNTS', (payload) => {
            const data = payload as { counts: Record<string, number> };
            setWordCounts(data.counts);
        });

        sync.on('TRENDS_END', () => {
            localEndTimerRef.current();
        });

        sync.on('TRENDS_RESET', () => {
            localResetRef.current();
        });

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            setIsLeader(data.isLeader);
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            sync.destroy();
            syncRef.current = null;
        };
    }, [active]);

    const ranked = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxCount = ranked[0]?.[1] ?? 1;
    const showReady = !sessionActive && ranked.length === 0;
    const showWaiting = tracking && ranked.length === 0;

    const statusContent = connected ? (
        <span className="inline-flex items-center gap-1.5 text-success">
            <InlineIcon icon={Circle} className="fill-current" />
            Conectado
        </span>
    ) : !tracking ? (
        <span className="inline-flex items-center gap-1.5 text-[#71717a]">
            <InlineIcon icon={Power} />
            Reposo
        </span>
    ) : isLeader ? (
        <span className="inline-flex items-center gap-1.5 text-warning">
            <InlineIcon icon={Loader2} className="animate-spin" />
            Conectando...
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-success">
            <InlineIcon icon={Network} />
            Sincronizado
        </span>
    );

    return (
        <div className={`${card} ${fadeIn} mb-3`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-2 max-md:flex-col max-md:items-start">
                <div className="flex items-center gap-3">
                    <CardHeaderIcon icon={BarChart2} />
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Tendencias de {displayName}</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">Ranking de palabras en tiempo real</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 max-md:w-full max-md:justify-between">
                    <div className="flex flex-wrap items-center gap-[15px] max-md:w-full max-md:flex-col max-md:items-stretch">
                        {!tracking && (
                            <div className="flex items-center gap-2.5 max-md:w-full max-md:flex-col max-md:items-stretch">
                                <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-bg-main px-2 py-1 max-md:w-full max-md:justify-between">
                                    <span className="px-1 text-[0.8125rem] font-medium text-[#c4c4cc]">Duración:</span>
                                    <button
                                        type="button"
                                        onClick={() => adjustMinutes(-1)}
                                        disabled={minutes <= 1}
                                        aria-label="Reducir minutos"
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#c4c4cc] transition hover:bg-white/10 hover:text-[#fafafa] disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <Minus className="text-xs" />
                                    </button>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={minutes}
                                            onChange={(e) => applyMinutesInput(e.target.value)}
                                            aria-label="Duración en minutos"
                                            className="w-10 border-none bg-transparent text-center text-[0.8125rem] font-semibold text-[#fafafa] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <span className="text-[0.8125rem] text-[#71717a]">min</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => adjustMinutes(1)}
                                        disabled={minutes >= 60}
                                        aria-label="Aumentar minutos"
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#c4c4cc] transition hover:bg-white/10 hover:text-[#fafafa] disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <Plus className="text-xs" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void startTracking()}
                                    title="Iniciar temporizador"
                                    aria-label="Iniciar temporizador"
                                    className="inline-flex items-center justify-center rounded-lg border-none px-3 py-1.5 text-success transition hover:bg-success/10"
                                >
                                    <Play className="size-4 shrink-0" />
                                </button>
                            </div>
                        )}

                        {tracking && (
                            <div
                                className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5"
                                role="timer"
                                aria-live="polite"
                                aria-label={`Cuenta atrás: ${formatTime(remaining)}`}
                            >
                                <Clock className="text-warning" />
                                <span className="text-[0.6875rem] font-semibold tracking-wide text-warning/80 uppercase">
                                    Restante
                                </span>
                                <span
                                    className={`min-w-[3.5rem] text-center font-[Consolas,monospace] text-[1.125rem] font-bold tracking-wider text-warning ${
                                        timerEnded ? 'opacity-60' : ''
                                    }`}
                                >
                                    {formatTime(remaining)}
                                </span>
                            </div>
                        )}

                        <span className="text-[0.8125rem]">{statusContent}</span>

                        <button
                            type="button"
                            onClick={reset}
                            title="Reiniciar: vuelve a la duración configurada y borra resultados"
                            className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-warning transition hover:bg-warning/10"
                        >
                            <RotateCw className="size-4 shrink-0" />
                        </button>
                    </div>

                    <InfoTooltip text="Analiza las palabras más repetidas en el chat durante un tiempo. Ideal para encuestas rápidas." />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.08] bg-black/20">
                                <th className="w-[50px] px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                    #
                                </th>
                                <th className="px-5 py-3.5 text-left text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                    Palabra
                                </th>
                                <th className="px-5 py-3.5 text-right text-[0.6875rem] font-bold tracking-wide text-[#c4c4cc] uppercase">
                                    Repeticiones
                                </th>
                                <th className="w-1/2 px-5 py-3.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {showReady ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-[#71717a]">
                                        <EmptyStateIcon icon={Play} />
                                        <h4 className="mb-1 text-[0.8125rem] font-bold text-[#fafafa]">
                                            Listo para analizar
                                        </h4>
                                        <p className="text-[0.8125rem]">
                                            Presiona el botón <strong className="text-[#fafafa]">Play</strong> para
                                            comenzar a contar palabras.
                                        </p>
                                    </td>
                                </tr>
                            ) : showWaiting ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-5 text-center text-[0.8125rem] text-[#71717a]">
                                        Esperando palabras...
                                    </td>
                                </tr>
                            ) : (
                                ranked.map(([word, count], i) => (
                                    <TrackerRow
                                        key={word}
                                        word={word}
                                        count={count}
                                        index={i}
                                        maxCount={maxCount}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
