import { useEffect, useRef, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { AppLogo } from '@/components/ui/AppLogo';
import {
    resetSessionLoadProgress,
    subscribeSessionLoadProgress,
    type SessionLoadProgressDetail
} from '@/lib/sessionLoadProgress';

interface VerifyingSessionModalProps {
    open: boolean;
    /** Si true, la barra salta al 100% y el overlay hace fade-out */
    done?: boolean;
    onExited?: () => void;
}

function useSmoothedProgress(target: number, active: boolean): number {
    const [displayed, setDisplayed] = useState(0);
    const targetRef = useRef(target);
    targetRef.current = target;

    useEffect(() => {
        if (!active) {
            setDisplayed(0);
            return;
        }

        let raf = 0;
        const tick = () => {
            setDisplayed((prev) => {
                const goal = targetRef.current;
                if (Math.abs(prev - goal) < 0.4) return goal;
                const step = Math.max(0.6, (goal - prev) * 0.12);
                return Math.min(prev + step, goal);
            });
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active]);

    return displayed;
}

export function VerifyingSessionModal({ open, done = false, onExited }: VerifyingSessionModalProps) {
    const [visible, setVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [barDone, setBarDone] = useState(false);
    const [detail, setDetail] = useState<SessionLoadProgressDetail>({
        progress: 0,
        label: 'Iniciando…',
        cached: false
    });
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const targetProgress = barDone ? 100 : detail.progress;
    const displayedProgress = useSmoothedProgress(targetProgress, visible && !isLeaving);
    const progressPercent = Math.round(displayedProgress);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setIsLeaving(false);
            setBarDone(false);
            resetSessionLoadProgress();
        }
    }, [open]);

    useEffect(() => {
        if (!visible) return;
        return subscribeSessionLoadProgress(setDetail);
    }, [visible]);

    useEffect(() => {
        if (!done || !visible) return;

        setBarDone(true);

        doneTimerRef.current = setTimeout(() => {
            setIsLeaving(true);
            exitTimerRef.current = setTimeout(() => {
                setVisible(false);
                setIsLeaving(false);
                setBarDone(false);
                onExited?.();
            }, 320);
        }, 420);

        return () => {
            if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    if (!visible) return null;

    const statusTitle = barDone ? '¡Listo!' : detail.label;
    const statusHint = barDone
        ? 'Bienvenido de vuelta.'
        : detail.cached
          ? 'Caché local activa — carga rápida.'
          : 'Sin caché — el servidor puede tardar unos segundos.';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-5 backdrop-blur-[4px]"
            style={{
                opacity: isLeaving ? 0 : 1,
                transition: 'opacity 0.32s ease',
                pointerEvents: isLeaving ? 'none' : 'all'
            }}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-label="Verificando sesión"
        >
            <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/97 shadow-[0_28px_90px_rgba(0,0,0,0.6)]">
                <div className="border-b border-white/[0.06] bg-[#101012] px-6 py-5">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-2xl bg-[#9146ff]/30 blur-lg" />
                            <AppLogo
                                alt="LosPerris"
                                className="relative h-14 w-14 rounded-2xl object-contain"
                                draggable={false}
                            />
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                            <p className="flex items-center gap-2 text-[1.05rem] font-bold text-white">
                                {!barDone && (
                                    <Loader2
                                        className="size-4 shrink-0 animate-spin text-[#9146ff]"
                                        aria-hidden
                                    />
                                )}
                                {statusTitle}
                            </p>
                            <p className="mt-1 text-[0.8125rem] leading-snug text-[#a1a1aa]">{statusHint}</p>
                        </div>

                        <span
                            className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[0.8125rem] font-bold tabular-nums text-[#c4b5fd]"
                            aria-hidden
                        >
                            {progressPercent}%
                        </span>
                    </div>

                    <div className="relative h-2 overflow-hidden rounded-full bg-[#1a1a2e]">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#9146ff] to-[#a78bfa] shadow-[0_0_12px_rgba(145,70,255,0.45)] transition-[width] duration-150 ease-out"
                            style={{ width: `${displayedProgress}%` }}
                        />
                    </div>

                    {!barDone && detail.label.includes('Despertando') && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[0.6875rem] font-medium text-[#71717a]">
                            <Zap className="size-3 shrink-0 text-amber-500/80" aria-hidden />
                            Sin caché — el servidor puede tardar unos segundos
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
