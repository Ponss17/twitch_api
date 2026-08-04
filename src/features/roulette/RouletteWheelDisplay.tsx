import { Crown, Dices, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, type TransitionEvent } from 'react';
import { WheelPointer } from '@/features/roulette/WheelPointer';
import { drawWheelOnCanvas } from '@/features/roulette/lib/wheelUtils';
import type { RouletteUser } from '@/core/types/twitch';
import { useTranslation } from '@/core/i18n/I18nContext';

export type RouletteWheelVariant = 'full' | 'overlay';

export interface RouletteWheelDisplayProps {
    chatters: RouletteUser[];
    wheelRotation: number;
    wheelTransition: string;
    isSpinning: boolean;
    winner: RouletteUser | null;
    lastSpinCount: number;
    variant?: RouletteWheelVariant;
    announceWinnerInChat?: boolean;
    onWheelTransitionEnd?: (e: TransitionEvent<HTMLDivElement>) => void;
    onDismissWinner?: () => void;
}

export function RouletteWheelDisplay({
    chatters,
    wheelRotation,
    wheelTransition,
    isSpinning,
    winner,
    lastSpinCount,
    variant = 'full',
    announceWinnerInChat = true,
    onWheelTransitionEnd,
    onDismissWinner
}: RouletteWheelDisplayProps) {
    const { t } = useTranslation();
    const rlT = t.minigames.roulette;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isSpinningRef = useRef(isSpinning);
    
    useEffect(() => {
        isSpinningRef.current = isSpinning;
    }, [isSpinning]);

    const drawWheel = useCallback((users: RouletteUser[], options: { labels?: boolean } = {}) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawWheelOnCanvas(ctx, canvas.width, canvas.height, users, options);
    }, []);

    useEffect(() => {
        drawWheel(chatters, { labels: !isSpinningRef.current });
    }, [chatters, drawWheel]);

    const isOverlay = variant === 'overlay';
    const containerClass = isOverlay
        ? 'relative mx-auto aspect-square w-full max-w-[480px] p-2'
        : 'relative mx-auto aspect-square max-w-[380px] p-5 max-[480px]:max-w-full max-[480px]:p-2.5';

    return (
        <div className="text-center text-text-main">
            <div className={containerClass}>
                <div
                    className={`absolute inset-5 rounded-full transition-shadow duration-300 max-[480px]:inset-2.5 ${
                        isSpinning
                            ? 'shadow-none border border-primary'
                            : 'shadow-none border border-border-subtle'
                    }`}
                    aria-hidden
                />

                <div
                    className={`relative h-full w-full origin-center will-change-transform ${
                        isSpinning ? 'motion-safe:brightness-110' : ''
                    }`}
                    style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: wheelTransition
                    }}
                    onTransitionEnd={onWheelTransitionEnd}
                >
                    <canvas
                        ref={canvasRef}
                        width={500}
                        height={500}
                        className="h-full w-full rounded-full"
                    />
                </div>

                <div
                    className="pointer-events-none absolute top-1 left-1/2 z-20 -translate-x-1/2"
                    aria-hidden
                >
                    <WheelPointer />
                </div>

                <div
                    className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex h-[14%] w-[14%] min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-primary/70 bg-bg-tertiary shadow-xl"
                    aria-hidden
                >
                    {chatters.length === 0 ? (
                        <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
                    ) : (
                        <Dices
                            className={`h-5 w-5 text-primary ${isSpinning ? 'animate-pulse' : ''}`}
                            aria-hidden="true"
                        />
                    )}
                </div>

                {chatters.length === 0 && !isOverlay && (
                    <div
                        className="pointer-events-none absolute top-[65%] left-1/2 z-[5] w-[52%] -translate-x-1/2 -translate-y-1/2 text-center"
                        aria-hidden
                    >
                        <p className="text-[0.8125rem] font-semibold leading-snug text-text-muted">
                            {rlT.noParticipants}
                        </p>
                        <p className="mt-1 text-[0.6875rem] leading-snug text-text-muted/80">
                            {rlT.pressPlay}
                        </p>
                    </div>
                )}

                {chatters.length === 1 && !isSpinning && (
                    <div
                        className="pointer-events-none absolute top-[15%] left-1/2 z-15 w-[62%] -translate-x-1/2"
                        aria-hidden
                    >
                        <span className="block rounded-lg bg-black/55 px-3 py-1.5 text-center text-[0.875rem] font-bold leading-tight text-white backdrop-blur-sm">
                            {chatters[0].user_name}
                        </span>
                    </div>
                )}

                {isSpinning && (
                    <div
                        className="pointer-events-none absolute inset-5 flex items-end justify-center pb-3 max-[480px]:inset-2.5"
                        aria-live="polite"
                    >
                        <span className="rounded-full bg-black/50 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-text-main uppercase backdrop-blur-sm">
                            {rlT.spinning}
                        </span>
                    </div>
                )}

                {winner && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-[4px]">
                        <div className="animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards] rounded-2xl border border-primary/40 bg-bg-secondary px-8 py-6 text-center opacity-0 shadow-2xl max-[480px]:px-6">
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                                <Crown className="size-6 text-amber-400" aria-hidden />
                            </div>
                            <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-muted">
                                {rlT.winner}
                            </p>
                            <p className="mb-1 text-[1.6rem] font-extrabold leading-tight text-primary">
                                {winner.user_name}
                            </p>
                            <p className="mb-4 flex items-center justify-center gap-1.5 text-[0.85rem] text-text-muted">
                                <Sparkles className="size-3.5 text-primary" aria-hidden />
                                {lastSpinCount || chatters.length} {rlT.participants.toLowerCase()}
                            </p>
                            {!isOverlay && !announceWinnerInChat ? (
                                <p className="mb-3 text-[0.75rem] text-text-muted">
                                    {rlT.notAnnounced}
                                </p>
                            ) : null}
                            {!isOverlay && onDismissWinner ? (
                                <button
                                    type="button"
                                    onClick={onDismissWinner}
                                    className="inline-flex items-center justify-center rounded-lg border border-border-strong bg-bg-secondary px-5 py-2 text-[0.8125rem] font-semibold text-text-main transition hover:border-text-main/30 hover:bg-text-main/10"
                                >
                                    {rlT.close}
                                </button>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
