import { useEffect, useRef, useState } from 'react';
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

    // Abrir overlay
    useEffect(() => {
        if (open) {
            setVisible(true);
            setIsLeaving(false);
            setBarDone(false);
        }
    }, [open]);

    // Cuando done=true: completar barra y salir
    useEffect(() => {
        if (!done || !visible) return;

        setBarDone(true);

        // Breve pausa en 100% antes de hacer fade-out
        doneTimerRef.current = setTimeout(() => {
            setIsLeaving(true);
            exitTimerRef.current = setTimeout(() => {
                setVisible(false);
                setIsLeaving(false);
                setBarDone(false);
                onExited?.();
            }, 400);
        }, 500);

        return () => {
            if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080808]"
            style={{
                opacity: isLeaving ? 0 : 1,
                transition: 'opacity 0.4s ease',
                pointerEvents: isLeaving ? 'none' : 'all',
            }}
            aria-live="polite"
            aria-label="Cargando dashboard"
        >
            {/* Barra de progreso en la parte superior */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1a1a2e]">
                <div
                    className="h-full bg-gradient-to-r from-[#7c3aed] via-[#9146ff] to-[#a78bfa] rounded-full"
                    style={{
                        width: barDone ? '100%' : undefined,
                        animation: barDone ? 'none' : 'splashProgress 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                        transition: barDone ? 'width 0.4s ease' : undefined,
                    }}
                />
            </div>

            {/* Contenido centrado */}
            <div className="flex flex-col items-center gap-5 px-6 text-center">
                <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-[#9146ff]/20 blur-2xl" />
                    <AppLogo
                        alt="LosPerris"
                        className="relative h-16 w-16 rounded-2xl object-contain"
                        draggable={false}
                    />
                </div>

                <div>
                    <p className="text-base font-semibold text-white">
                        {barDone ? '¡Listo!' : 'Verificando sesión...'}
                    </p>
                    <p className="mt-1 text-sm text-[#52525b]">
                        {barDone ? 'Bienvenido de vuelta.' : 'Validando tus datos con Twitch.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
