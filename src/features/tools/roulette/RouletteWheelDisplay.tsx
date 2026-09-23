import { Crown, Dices, RotateCcw, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, type TransitionEvent } from 'react';
import { WheelPointer } from '@/features/tools/roulette/WheelPointer';
import { drawWheelOnCanvas, resolveWheelPalette } from '@/features/tools/roulette/lib/wheelUtils';
import type { RouletteUser } from '@/core/types/twitch';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useTheme } from '@/core/theme/useTheme';

export type RouletteWheelVariant = 'full' | 'overlay';
export type RoulettePointerSide = 'top' | 'bottom';

export interface RouletteWheelDisplayProps {
    chatters: RouletteUser[];
    wheelRotation: number;
    wheelTransition: string;
    isSpinning: boolean;
    winner: RouletteUser | null;
    lastSpinCount: number;
    wheelColor?: string;
    variant?: RouletteWheelVariant;
    /** Aguja arriba (chatters) o abajo (premios bits). */
    pointerSide?: RoulettePointerSide;
    /** Oculta “N Participantes · En el chat” (p. ej. ruleta de premios). */
    showResultMeta?: boolean;
    /** Si false, los nombres de segmento siguen visibles al girar (p. ej. premios bits). */
    hideLabelsWhileSpinning?: boolean;
    /** Avatar del canal en el hub (p. ej. Ruleta Bits). */
    centerAvatarUrl?: string | null;
    announceWinnerInChat?: boolean;
    onWheelTransitionEnd?: (e: TransitionEvent<HTMLDivElement>) => void;
    onDismissWinner?: () => void;
    onRespinWithoutWinner?: () => void;
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
    pointerSide = 'top',
    showResultMeta = true,
    hideLabelsWhileSpinning = true,
    centerAvatarUrl = null,
    announceWinnerInChat = true,
    onWheelTransitionEnd,
    onDismissWinner,
    onRespinWithoutWinner
}: RouletteWheelDisplayProps) {
    const { t } = useTranslation();
    const rlT = t.tools.roulette;
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // `auto` lee data-theme en resolveWheelPalette — hay que invalidar al cambiar tema.
    const palette = useMemo(() => {
        void theme;
        return resolveWheelPalette(wheelColor);
    }, [wheelColor, theme]);

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

    const showLabels = !hideLabelsWhileSpinning || !isSpinning;

    useEffect(() => {
        drawWheel(chatters, { labels: showLabels, wheelColor });
    }, [chatters, wheelColor, drawWheel, theme, showLabels]);

    const isOverlay = variant === 'overlay';
    const containerClass = isOverlay
        ? 'relative mx-auto aspect-square w-full max-w-[480px] p-2'
        : 'relative mx-auto aspect-square max-w-[380px] p-5 max-[480px]:max-w-full max-[480px]:p-2.5';

    return (
        <div className="relative mx-auto w-full max-w-[480px] text-center text-text-main">
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
                    className={
                        pointerSide === 'bottom'
                            ? 'pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 rotate-180'
                            : 'pointer-events-none absolute top-1 left-1/2 z-20 -translate-x-1/2'
                    }
                    aria-hidden
                >
                    <WheelPointer color={palette.primaryHex} stroke={palette.borderRgba} />
                </div>

                <div
                    className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex h-[14%] w-[14%] min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] bg-bg-tertiary shadow-xl"
                    style={{ borderColor: palette.borderRgba }}
                    aria-hidden
                >
                    {centerAvatarUrl ? (
                        <img
                            src={centerAvatarUrl}
                            alt=""
                            className="size-full object-cover"
                            draggable={false}
                        />
                    ) : showResultMeta ? (
                        chatters.length === 0 ? (
                            <Users className="h-5 w-5 text-text-muted" aria-hidden="true" />
                        ) : (
                            <Dices
                                className={`h-5 w-5 ${isSpinning ? 'animate-pulse' : ''}`}
                                style={{ color: palette.primaryHex }}
                                aria-hidden="true"
                            />
                        )
                    ) : (
                        <span
                            className="block size-2.5 rounded-full"
                            style={{ backgroundColor: palette.primaryHex }}
                            aria-hidden
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

            {/* En overlay: absolute para no desplazar la ruleta. En panel: flujo normal. */}
            {winner ? (
                <div
                    role="status"
                    aria-live="polite"
                    className={
                        isOverlay
                            ? 'animate-in fade-in zoom-in-95 absolute top-[calc(100%-0.25rem)] left-1/2 z-30 w-[min(100%,24rem)] -translate-x-1/2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 duration-200'
                            : 'animate-in fade-in zoom-in-95 mx-auto mt-2 flex max-w-sm flex-col items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 duration-200'
                    }
                    style={{
                        borderColor: palette.borderRgba,
                        backgroundColor: palette.glowRgba.replace('0.45', '0.12')
                    }}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Crown className="size-4" style={{ color: palette.primaryHex }} aria-hidden="true" />
                        <span className="text-[0.75rem] font-medium uppercase tracking-wider text-text-muted">
                            {rlT.winner}
                        </span>
                        <Sparkles className="size-4" style={{ color: palette.primaryHex }} aria-hidden="true" />
                    </div>
                    <span className="mt-1 block text-[1.125rem] font-bold text-text-main">
                        {winner.user_name}
                    </span>
                    {showResultMeta && (lastSpinCount || chatters.length) > 1 ? (
                        <span className="mt-0.5 block text-[0.75rem] text-text-muted">
                            {lastSpinCount || chatters.length} {rlT.participants}
                            {announceWinnerInChat ? ` · ${rlT.inChat}` : ''}
                        </span>
                    ) : null}
                    {onDismissWinner && (
                        <div className="mt-1 flex items-center justify-center gap-2">
                            {onRespinWithoutWinner && (
                                <button
                                    type="button"
                                    onClick={onRespinWithoutWinner}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.75rem] text-primary transition hover:bg-white/10"
                                >
                                    <RotateCcw className="size-3" />
                                    {rlT.respin}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onDismissWinner}
                                className="rounded-md px-2 py-0.5 text-[0.75rem] text-text-muted transition hover:bg-white/10 hover:text-text-main"
                            >
                                {rlT.close}
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
