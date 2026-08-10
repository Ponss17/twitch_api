import { useEffect, useRef, useState } from 'react';
import { AppLogo } from '@/shared/ui/AppLogo';
import {
    resetSessionLoadProgress,
    subscribeSessionLoadProgress,
    type SessionLoadProgressDetail
} from '@/core/session/loadProgress';
import { useTranslation } from '@/core/i18n/I18nContext';


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
                
                // Si la meta oficial es 100 (carga completada), acelerar hacia 100 y detener.
                if (goal >= 100) {
                    if (prev >= 100) return 100;
                    return Math.min(100, prev + Math.max(1, (100 - prev) * 0.15));
                }

                // Si aún no hemos alcanzado la meta parcial dictada por el servidor, ir hacia ella.
                if (prev < goal) {
                    return Math.min(99, prev + Math.max(0.1, (goal - prev) * 0.08));
                } 
                
                // Fake progress: Si ya llegamos a la meta parcial, seguimos avanzando
                // muuuy lentamente para que la barra nunca se vea "congelada".
                // Topamos en 99% para que nunca marque finalizado hasta que el goal sea 100.
                return Math.min(99, prev + 0.03);
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

    // Always call hooks before any early return (Rules of Hooks)
    const { t } = useTranslation();

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

        // Tiempo de espera (2 segundos) para que el usuario lea el mensaje de éxito antes de entrar
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

    const detailLabel = detail.label === 'Iniciando…' ? t.globals.loading.starting : detail.label;
    const statusTitle = barDone ? t.verifying.authenticated : detailLabel;
    const statusHint = barDone
        ? t.verifying.accessGranted
        : detail.cached
            ? t.verifying.cacheActive
            : t.verifying.noCache;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-main font-[Outfit,sans-serif]"
            style={{
                opacity: isLeaving ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
                pointerEvents: isLeaving ? 'none' : 'all'
            }}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-label={t.common.aria.verifyingSession}
        >
            <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
                {/* Logo con resplandor */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
                    <AppLogo
                        className="relative h-20 w-20 text-primary object-contain drop-shadow-[0_0_15px_var(--primary)] animate-pulse"
                    />
                </div>

                {/* Textos sin spinner, más alineados al diseño Tech Clean */}
                <div className="mb-6 flex flex-col items-center justify-center h-[4.5rem] w-full">
                    <h2 className="text-[1.3rem] font-bold tracking-tight text-text-main w-full truncate">
                        {statusTitle}
                    </h2>
                    <p className="mt-1 text-[0.85rem] font-medium text-text-muted w-full truncate">
                        {statusHint}
                    </p>
                </div>

                {/* Barra de progreso de segmentos de datos */}
                <div className="w-full max-w-[280px] relative flex flex-col items-center">
                    <div className="flex w-full gap-[3px] h-1 mb-1">
                        {Array.from({ length: 20 }).map((_, i) => {
                            const isActive = i < Math.floor((displayedProgress / 100) * 20);
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-[2px] transition-colors duration-200 ${
                                        isActive 
                                            ? 'bg-primary shadow-[0_0_8px_var(--primary)]' 
                                            : 'bg-bg-secondary'
                                    }`}
                                />
                            );
                        })}
                    </div>

                    {/* Porcentaje numérico */}
                    <div className="mt-3 font-mono text-[0.75rem] font-bold tracking-[0.1em] text-primary">
                        {progressPercent}%
                    </div>
                </div>
            </div>
        </div>
    );
}
