import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/ui/AppLogo';

interface VerifyingSessionModalProps {
    open: boolean;
    /** Si true, la barra salta al 100% y el overlay hace fade-out */
    done?: boolean;
    onExited?: () => void;
}

export function VerifyingSessionModal({ open, done = false, onExited }: VerifyingSessionModalProps) {
    const [visible, setVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [barDone, setBarDone] = useState(false);
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setIsLeaving(false);
            setBarDone(false);
        }
    }, [open]);

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
            }, 280);
        }, 320);

        return () => {
            if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[3px]"
            style={{
                opacity: isLeaving ? 0 : 1,
                transition: 'opacity 0.28s ease',
                pointerEvents: isLeaving ? 'none' : 'all'
            }}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            aria-label="Verificando sesión"
        >
            <div className="w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <div className="h-0.5 bg-[#1a1a2e]">
                    <div
                        className="h-full bg-gradient-to-r from-[#7c3aed] via-[#9146ff] to-[#a78bfa]"
                        style={{
                            width: barDone ? '100%' : undefined,
                            animation: barDone
                                ? 'none'
                                : 'splashProgress 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                            transition: barDone ? 'width 0.28s ease' : undefined
                        }}
                    />
                </div>

                <div className="flex items-center gap-3.5 px-4 py-4">
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-xl bg-[#9146ff]/25 blur-md" />
                        <AppLogo
                            alt="LosPerris"
                            className="relative h-10 w-10 rounded-xl object-contain"
                            draggable={false}
                        />
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                        <p className="flex items-center gap-2 text-[0.9rem] font-semibold text-white">
                            {!barDone && (
                                <Loader2 className="size-3.5 shrink-0 animate-spin text-[#9146ff]" aria-hidden />
                            )}
                            {barDone ? '¡Listo!' : 'Verificando sesión…'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#71717a]">
                            {barDone ? 'Bienvenido de vuelta.' : 'Validando con Twitch.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
