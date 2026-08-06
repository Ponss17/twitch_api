import { Crown, Dices, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, type TransitionEvent } from 'react';
import { WheelPointer } from '@/features/roulette/WheelPointer';
import { drawWheelOnCanvas, resolveWheelPalette } from '@/features/roulette/lib/wheelUtils';
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
    wheelColor?: string;
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
    wheelColor,
    variant = 'full',
    announceWinnerInChat = true,
    onWheelTransitionEnd,
    onDismissWinner
}: RouletteWheelDisplayProps) {
    const { t } = useTranslation();
    const rlT = t.minigames.roulette;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isSpinningRef = useRef(isSpinning);

    const palette = useMemo(() => resolveWheelPalette(wheelColor), [wheelColor]);

    useEffect(() => {
        isSpinningRef.current = isSpinning;
    }, [isSpinning]);

    const drawWheel = useCallback(
        (users: RouletteUser[], options: { labels?: boolean; wheelColor?: string } = {}) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            drawWheelOnCanvas(ctx, canvas.width, canvas.height, users, options);
        },
        []
    );

    useEffect(() => {
        drawWheel(chatters, { labels: !isSpinningRef.current, wheelColor });
    }, [chatters, wheelColor, drawWheel]);

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
                    style={isSpinning ? { borderColor: palette.primaryHex } : undefined}
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
                    <WheelPointer color={palette.primaryHex} stroke={palette.borderRgba} />
                </div>

                <div
                    className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex h-[14%] w-[14%] min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] bg-bg-tertiary shadow-xl"
                    style={{ borderColor: palette.borderRgba }}
                    aria-hidden
                >
                    {chatters.length === 0 ? (
                        <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
                    ) : (
                        <Dices
                            className={`h-5 w-5 ${isSpinning ? 'animate-pulse' : ''}`}
                            style={{ color: palette.primaryHex }}
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
            </div>

            {winner && (
                <div
                    role="status"
                    aria-live="polite"
                    className="animate-in fade-in zoom-in-95 mx-auto mt-2 flex max-w-sm flex-col items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 duration-200"
                    style={{
                        borderColor: palette.borderRgba,
                        backgroundColor: palette.glowRgba.replace('0.45', '0.12')
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Crown className="size-4" style={{ color: palette.primaryHex }} aria-hidden="true" />
                        <span className="text-[0.75rem] font-medium uppercase tracking-wider text-text-muted">
                            {rlT.winner}
                        </span>
                        <Sparkles className="size-4" style={{ color: palette.primaryHex }} aria-hidden="true" />
                    </div>
                    <span className="text-[1.125rem] font-bold text-text-main">
                        {winner.user_name}
                    </span>
                    <span className="text-[0.75rem] text-text-muted">
                        {lastSpinCount || chatters.length} {rlT.participants}
                        {announceWinnerInChat ? ` · ${rlT.inChat}` : ''}
                    </span>
                    {onDismissWinner && (
                        <button
                            type="button"
                            onClick={onDismissWinner}
                            className="mt-1 rounded-md px-2 py-0.5 text-[0.75rem] text-text-muted transition hover:bg-white/10 hover:text-text-main"
                        >
                            {rlT.close}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
