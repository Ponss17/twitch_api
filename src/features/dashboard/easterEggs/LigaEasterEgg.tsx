import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { modalPanel, btnIcon } from '@/core/utils/tw';

const DURATION_MS = 2200;

export function LigaEasterEgg() {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const handleTrigger = () => setActive(true);
        window.addEventListener('app:trigger-liga-easter-egg', handleTrigger);
        return () => window.removeEventListener('app:trigger-liga-easter-egg', handleTrigger);
    }, []);

    useEffect(() => {
        if (!active) return;

        const timer = setTimeout(() => setActive(false), DURATION_MS);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActive(false);
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [active]);

    if (!active) return null;

    return (
        <div
            role="dialog"
            aria-label="Modo Liga"
            onClick={() => setActive(false)}
            className="fixed inset-0 z-[99999] flex cursor-pointer select-none items-center justify-center p-4 animate-fade-soft"
        >
            {/* Fondo del estadio — solo se descarga al activarse, CDN + caché del browser */}
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src="/img/alejando-morera.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover object-center brightness-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60" />
            </div>

            <div
                onClick={(e) => e.stopPropagation()}
                className={`${modalPanel} relative z-10 w-full max-w-[380px] overflow-hidden text-center border-border-strong bg-bg-modal/90 shadow-2xl animate-reveal-card`}
            >
                <button
                    type="button"
                    onClick={() => setActive(false)}
                    aria-label="Cerrar"
                    className={`${btnIcon} absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-lg p-0`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex flex-col items-center px-6 pt-7 pb-6">
                    <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
                        <img
                            src="/img/liga_full.svg"
                            alt="Escudo Liga Deportiva Alajuelense"
                            className="h-16 w-16 drop-shadow-[0_2px_12px_rgba(239,68,68,0.5)]"
                        />
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-text-main sm:text-2xl">
                        ¡Viva la Liga!
                    </h2>

                    <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs font-medium text-text-muted">
                            Estadio Alejandro Morera Soto
                        </p>
                        <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-primary">
                            La Catedral del Fútbol
                        </p>
                    </div>
                </div>

                <div className="h-1 w-full bg-bg-secondary border-t border-border-subtle overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-amber-500"
                        style={{ animation: `shrinkWidth ${DURATION_MS}ms linear forwards` }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes shrinkWidth {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
