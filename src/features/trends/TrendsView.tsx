import { Circle, Power, Loader2, Network, BarChart2, Minus, Plus, Play, Clock, RotateCw } from 'lucide-react';
import { useRequiredSession } from '@/core/session/useSession';
import { useTrendsController } from '@/features/trends/hooks/useTrendsController';
import { TrendsLeaderboardDisplay } from '@/features/trends/TrendsLeaderboardDisplay';
import { formatTrendsTime } from '@/features/trends/TrackerRow';
import { OverlayUrlButton } from '@/features/overlay/components/OverlayUrlButton';
import { useOverlayPublish } from '@/features/overlay/hooks/useOverlayPublish';
import { fadeIn, hoverSubtleIconBtn, panelCard } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { useToast } from '@/shared/ui/ToastProvider';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { InlineIcon } from '@/shared/ui/Icon';

export function TrendsView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { showToast } = useToast();

    const handleStateChange = useOverlayPublish({
        tool: 'trends',
        session,
        active,
        shouldSkip: (state) => !active && !state.tracking,
        isCritical: (state) =>
            !state.tracking ||
            state.timerEnded ||
            (state.tracking && state.remaining >= state.minutes * 60),
        resetCacheWhen: (state) => !state.tracking || state.timerEnded
    });

    const {
        minutes,
        adjustMinutes,
        applyMinutesInput,
        tracking,
        connected,
        remaining,
        timerEnded,
        sessionActive,
        isLeader,
        ranked,
        maxCount,
        displayName,
        startTracking,
        reset
    } = useTrendsController({
        session,
        active,
        onStateChange: handleStateChange,
        showToast
    });

    const statusContent = connected ? (
        <span className="inline-flex items-center gap-1.5 text-success">
            <InlineIcon icon={Circle} className="fill-current" />
            Conectado
        </span>
    ) : !tracking ? (
        <span className="inline-flex items-center gap-1.5 text-[#a1a1aa]">
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
        <div className={`${panelCard} ${fadeIn} mb-3 flex flex-col`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5 max-md:flex-col max-md:items-start">
                <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}>
                        <BarChart2 className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-[#fafafa]">
                            Tendencias de {displayName}
                        </h2>
                        <p className="mt-0.5 text-[0.75rem] leading-snug text-[#8b8b93]">
                            Ranking de palabras en tiempo real
                        </p>
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
                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[#c4c4cc] disabled:cursor-not-allowed disabled:opacity-30 ${hoverSubtleIconBtn}`}
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
                                        <span className="text-[0.8125rem] text-[#a1a1aa]">min</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => adjustMinutes(1)}
                                        disabled={minutes >= 60}
                                        aria-label="Aumentar minutos"
                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[#c4c4cc] disabled:cursor-not-allowed disabled:opacity-30 ${hoverSubtleIconBtn}`}
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
                                aria-label={`Cuenta atrás: ${formatTrendsTime(remaining)}`}
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
                                    {formatTrendsTime(remaining)}
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

                    <OverlayUrlButton tool="trends" />

                    <InfoTooltip 
                        text="Analiza las palabras más repetidas en el chat. Puedes acotar el tiempo con el temporizador." 
                        placement="bottom"
                    />
                </div>
            </header>

            <div className="p-5">
                <TrendsLeaderboardDisplay
                ranked={ranked}
                maxCount={maxCount}
                tracking={tracking}
                remaining={remaining}
                timerEnded={timerEnded}
                sessionActive={sessionActive}
                displayName={displayName}
                variant="full"
            />
            </div>
        </div>
    );
}
