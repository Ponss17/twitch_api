import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { modalPanel, btnIcon } from '@/core/utils/tw';

const DURATION_MS = 5500;

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    decay: number;
}

const SPARK_COLORS = ['#ef4444', '#f87171', '#dc2626', '#f59e0b', '#fbbf24', '#ffffff'];

export function LigaEasterEgg() {
    const [active, setActive] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const handleTrigger = () => {
            setActive(true);
        };

        window.addEventListener('app:trigger-liga-easter-egg', handleTrigger);
        return () => {
            window.removeEventListener('app:trigger-liga-easter-egg', handleTrigger);
        };
    }, []);

    useEffect(() => {
        if (!active) return;

        const timer = setTimeout(() => {
            setActive(false);
        }, DURATION_MS);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActive(false);
        };
        window.addEventListener('keydown', handleKeyDown);

        // Canvas sparks & firework embers
        let animId: number;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const width = (canvas.width = window.innerWidth);
                const height = (canvas.height = window.innerHeight);

                const sparks: Spark[] = Array.from({ length: 85 }).map(() => {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 5.5;
                    return {
                        x: width / 2 + (Math.random() - 0.5) * (width * 0.55),
                        y: height * 0.28 + (Math.random() - 0.5) * 100,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1.5,
                        size: 2 + Math.random() * 3.5,
                        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
                        alpha: 0.85 + Math.random() * 0.15,
                        decay: 0.0035 + Math.random() * 0.007
                    };
                });

                const render = () => {
                    ctx.clearRect(0, 0, width, height);

                    let alive = 0;
                    sparks.forEach((s) => {
                        if (s.alpha > 0.01) {
                            alive++;
                            s.x += s.vx;
                            s.y += s.vy;
                            s.vy += 0.04;
                            s.vx *= 0.99;
                            s.alpha = Math.max(0, s.alpha - s.decay);

                            ctx.save();
                            ctx.globalAlpha = s.alpha;
                            ctx.fillStyle = s.color;
                            ctx.shadowColor = s.color;
                            ctx.shadowBlur = 8;
                            ctx.beginPath();
                            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });

                    if (alive > 0) {
                        animId = requestAnimationFrame(render);
                    }
                };

                animId = requestAnimationFrame(render);
            }
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKeyDown);
            if (animId) cancelAnimationFrame(animId);
        };
    }, [active]);

    if (!active) return null;

    return (
        <div
            role="dialog"
            aria-label="Modo Liga - Alejandro Morera Soto"
            onClick={() => setActive(false)}
            className="fixed inset-0 z-[99999] flex cursor-pointer select-none items-center justify-center overflow-hidden bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-300 animate-fade-soft"
        >
            {/* Cinematic Fullscreen Stadium Background */}
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src="/img/alejando-morera.webp"
                    alt="Estadio Alejandro Morera Soto"
                    className="h-full w-full object-cover object-center filter brightness-[0.65] contrast-[1.12] scale-105 transition-transform duration-[6000ms] ease-out"
                    style={{ transform: 'scale(1.14)' }}
                />
                {/* Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/75" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.45)_0%,transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.8)_100%)]" />
            </div>

            {/* Firework Sparks Canvas */}
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

            {/* Native Project Modal Panel */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={`${modalPanel} relative z-10 w-full max-w-[420px] text-center border-border-strong bg-bg-modal/95 backdrop-blur-xl shadow-2xl animate-reveal-card`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={() => setActive(false)}
                    aria-label="Cerrar"
                    className={`${btnIcon} absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Modal Body Content */}
                <div className="flex flex-col items-center px-6 pt-8 pb-7">
                    {/* Escudo con resplandor carmesí */}
                    <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
                        <img
                            src="/img/liga_full.svg"
                            alt="Escudo Liga Deportiva Alajuelense"
                            className="relative h-20 w-20 drop-shadow-[0_4px_20px_rgba(239,68,68,0.85)] transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    {/* Titular */}
                    <h2 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                        ¡Viva la Liga!
                    </h2>

                    {/* Subtítulo */}
                    <div className="mt-2 space-y-0.5">
                        <p className="text-sm font-medium text-text-muted">
                            Estadio Alejandro Morera Soto
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            La Catedral del Fútbol
                        </p>
                    </div>
                </div>

                {/* Barra de progreso inferior sincronizada */}
                <div className="h-1 w-full bg-bg-secondary border-t border-border-subtle overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary via-primary-hover to-amber-500 transition-all ease-linear"
                        style={{
                            animation: `shrinkWidth ${DURATION_MS}ms linear forwards`
                        }}
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
