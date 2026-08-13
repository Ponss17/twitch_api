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

function useSmoothedProgress(
    target: number,
    active: boolean,
    onFrame: (value: number) => void
) {
    const targetRef = useRef(target);
    const valueRef = useRef(0);
    const onFrameRef = useRef(onFrame);
    targetRef.current = target;
    onFrameRef.current = onFrame;

    useEffect(() => {
        if (!active) return;

        valueRef.current = 0;
        onFrameRef.current(0);

        let raf = 0;
        let running = true;

        const tick = () => {
            if (!running) return;

            const prev = valueRef.current;
            const goal = targetRef.current;
            let next: number;

            if (goal >= 100) {
                next = prev >= 100 ? 100 : Math.min(100, prev + Math.max(1, (100 - prev) * 0.15));
            } else if (prev < goal) {
                next = Math.min(99, prev + Math.max(0.1, (goal - prev) * 0.08));
            } else {
                next = Math.min(99, prev + 0.03);
            }

            valueRef.current = next;
            onFrameRef.current(next);

            if (goal >= 100 && next >= 100) return;
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => {
            running = false;
            cancelAnimationFrame(raf);
        };
    }, [active]);
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
    const barFillRef = useRef<HTMLDivElement>(null);
    const [progressPercent, setProgressPercent] = useState(0);

    useSmoothedProgress(targetProgress, visible && !isLeaving, (value) => {
        const fill = barFillRef.current;
        if (fill) fill.style.width = `${value}%`;
        const pct = Math.round(value);
        setProgressPercent((prev) => (prev === pct ? prev : pct));
    });

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
                <AppLogo className="mb-10 h-20 w-20 text-primary" />

                <div className="mb-6 flex h-[4.5rem] w-full flex-col items-center justify-center">
                    <h2 className="w-full truncate text-[1.3rem] font-bold tracking-tight text-text-main">
                        {statusTitle}
                    </h2>
                    <p className="mt-1 w-full truncate text-[0.85rem] font-medium text-text-muted">
                        {statusHint}
                    </p>
                </div>

                <div className="relative flex w-full max-w-[280px] flex-col items-center">
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-bg-secondary">
                        <div ref={barFillRef} className="h-full w-0 rounded-full bg-primary" />
                    </div>
                    <div className="mt-3 font-mono text-[0.75rem] font-bold tracking-[0.1em] text-primary">
                        {progressPercent}%
                    </div>
                </div>
            </div>
        </div>
    );
}
