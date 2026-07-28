import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/shared/ui/AppLogo';
import {
    resetSessionLoadProgress,
    subscribeSessionLoadProgress,
    type SessionLoadProgressDetail
} from '@/core/session/loadProgress';

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

        // Aumentar el tiempo de espera (1.2 segundos) para que el usuario perciba que terminó
        doneTimerRef.current = setTimeout(() => {
            setIsLeaving(true);
            exitTimerRef.current = setTimeout(() => {
                setVisible(false);
                setIsLeaving(false);
                setBarDone(false);
                onExited?.();
            }, 400); // fade out duration
        }, 1200);

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
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] font-[Outfit,sans-serif]"
            style={{
                opacity: isLeaving ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
                pointerEvents: isLeaving ? 'none' : 'all'
            }}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-label="Verificando sesión"
        >
            <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
                {/* Logo con resplandor */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 rounded-3xl bg-[#9146ff]/20 blur-2xl" />
                    <AppLogo
                        alt="LosPerris"
                        className="relative h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(145,70,255,0.4)] animate-pulse"
                        draggable={false}
                    />
                </div>

                {/* Textos y Loader (Con altura fija para evitar saltos) */}
                <div className="mb-6 flex flex-col items-center justify-center h-[4.5rem] w-full">
                    <h2 className="flex items-center justify-center gap-3 text-2xl font-bold tracking-tight text-white w-full">
                        {!barDone && (
                            <Loader2
                                className="h-5 w-5 shrink-0 animate-spin text-[#9146ff]"
                                aria-hidden
                            />
                        )}
                        <span className="truncate">{statusTitle}</span>
                    </h2>
                    <p className="mt-2 text-[0.9rem] font-medium text-[#71717a] w-full truncate">
                        {statusHint}
                    </p>
                </div>

                {/* Barra de progreso ultra fina */}
                <div className="w-full relative flex flex-col items-center">
                    <div className="relative w-64 h-1 overflow-hidden rounded-full bg-white/[0.05] shadow-inner">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-[#9146ff] transition-all duration-300 ease-out shadow-[0_0_10px_#9146ff]"
                            style={{ width: `${displayedProgress}%` }}
                        />
                    </div>
                    
                    {/* Porcentaje numérico suave abajo de la barra */}
                    <div className="mt-4 font-mono text-[0.8rem] font-medium tracking-widest text-white/40">
                        {progressPercent}%
                    </div>
                </div>
            </div>
        </div>
    );
}
