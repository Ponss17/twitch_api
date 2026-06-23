import { useEffect, useRef, useState } from 'react';
import { AppLogo } from '@/components/ui/AppLogo';

interface VerifyingSessionModalProps {
    open: boolean;
    /** Si true, la barra salta al 100% y el modal hace fade-out */
    done?: boolean;
    onExited?: () => void;
}

export function VerifyingSessionModal({ open, done = false, onExited }: VerifyingSessionModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [phase, setPhase] = useState<'hidden' | 'loading' | 'done' | 'exiting'>('hidden');

    // Controlar apertura/cierre del <dialog>
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            setPhase('loading');
        } else if (!open && dialog.open) {
            setPhase('exiting');
        }
    }, [open]);

    // Cuando done=true, avanzar la barra al 100% y salir
    useEffect(() => {
        if (!done || phase !== 'loading') return;
        setPhase('done');
        const timer = setTimeout(() => {
            setPhase('exiting');
        }, 600); // 600ms en 100% antes de salir
        return () => clearTimeout(timer);
    }, [done, phase]);

    // Al salir, esperar el fade-out y cerrar
    useEffect(() => {
        if (phase !== 'exiting') return;
        const timer = setTimeout(() => {
            const dialog = dialogRef.current;
            if (dialog?.open) dialog.close();
            setPhase('hidden');
            onExited?.();
        }, 400); // duración del fade-out CSS
        return () => clearTimeout(timer);
    }, [phase, onExited]);

    // Bloquear tecla Escape
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => e.preventDefault();
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, []);

    const isExiting = phase === 'exiting';
    const isDone = phase === 'done';

    return (
        <dialog
            ref={dialogRef}
            className="m-0 h-full w-full max-w-none bg-transparent p-0 outline-none backdrop:bg-black/80 backdrop:backdrop-blur-sm"
            style={{
                opacity: isExiting ? 0 : 1,
                transition: 'opacity 0.4s ease',
            }}
        >
            <div className="flex h-full w-full items-center justify-center px-4">
                <div
                    className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#9146ff]/30 bg-[#0a0a0f] shadow-[0_0_60px_rgba(145,70,255,0.15)]"
                    style={{
                        transform: isExiting ? 'scale(0.96) translateY(8px)' : 'scale(1) translateY(0)',
                        transition: 'transform 0.4s ease',
                    }}
                >
                    {/* Barra de progreso top */}
                    <div className="h-0.5 w-full bg-[#1a1a2e] overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#7c3aed] via-[#9146ff] to-[#a78bfa]"
                            style={{
                                width: isDone ? '100%' : undefined,
                                animation: isDone ? 'none' : 'splashProgress 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                                transition: isDone ? 'width 0.5s ease' : undefined,
                            }}
                        />
                    </div>

                    {/* Contenido */}
                    <div className="flex flex-col items-center px-8 py-10 text-center">
                        {/* Logo con glow */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-2xl bg-[#9146ff]/20 blur-xl" />
                            <AppLogo
                                alt="LosPerris"
                                className="relative h-20 w-20 rounded-2xl object-contain"
                                draggable={false}
                            />
                        </div>

                        <h3 className="mb-2 text-xl font-bold tracking-tight text-white">
                            {isDone ? '¡Listo!' : 'Verificando sesión...'}
                        </h3>

                        <p className="max-w-[240px] text-sm leading-relaxed text-[#71717a]">
                            {isDone
                                ? 'Bienvenido de vuelta.'
                                : 'Validando tus datos con Twitch, un momento.'}
                        </p>

                        {/* Indicador de pasos */}
                        <div className="mt-8 flex items-center gap-2">
                            <Step active={!isDone} done={false} label="Sesión" />
                            <div className="h-px w-8 bg-[#27272a]" />
                            <Step active={isDone} done={isDone} label="Dashboard" />
                        </div>
                    </div>
                </div>
            </div>
        </dialog>
    );
}

function Step({ active, done, label }: { active: boolean; done: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all duration-500 ${
                    done
                        ? 'border-[#9146ff] bg-[#9146ff] text-white'
                        : active
                          ? 'border-[#9146ff] bg-[#9146ff]/10 text-[#9146ff]'
                          : 'border-[#27272a] bg-transparent text-[#52525b]'
                }`}
            >
                {done ? <i className="fa-solid fa-check text-[10px]" /> : active ? <i className="fa-solid fa-circle-notch fa-spin text-[10px]" /> : '2'}
            </div>
            <span className={`text-[10px] font-medium ${active || done ? 'text-[#9146ff]' : 'text-[#52525b]'}`}>
                {label}
            </span>
        </div>
    );
}
