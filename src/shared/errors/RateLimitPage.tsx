import { useEffect, useState } from 'react';
import { ErrorPage } from '@/shared/errors/ErrorPage';
import { Clock, RotateCw, Lock } from 'lucide-react';
import { clearRateLimitCooldown, resolveRateLimitCooldownEnd } from '@/core/errors/rateLimitCooldown';

function formatCountdown(ms: number): string {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function RateLimitPage() {
    const [timeLeft, setTimeLeft] = useState('00:00');
    const [ready, setReady] = useState(false);
    const [hasActiveCooldown, setHasActiveCooldown] = useState(false);

    useEffect(() => {
        const end = resolveRateLimitCooldownEnd();

        if (!end) {
            setHasActiveCooldown(false);
            setReady(true);
            setTimeLeft('00:00');
            return;
        }

        setHasActiveCooldown(true);
        setReady(false);

        let raf = 0;
        const tick = () => {
            const left = end - Date.now();
            if (left <= 0) {
                setTimeLeft('00:00');
                setReady(true);
                setHasActiveCooldown(false);
                clearRateLimitCooldown();
                return;
            }
            setTimeLeft(formatCountdown(left));
            raf = requestAnimationFrame(tick);
        };

        tick();
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <ErrorPage
            code="Seguridad"
            title="¡Wow, vas muy rápido!"
            message={
                hasActiveCooldown
                    ? 'Has excedido el límite de peticiones. Espera a que termine el contador antes de reintentar.'
                    : 'Si acabas de superar el límite, vuelve al panel e inténtalo de nuevo en unos instantes.'
            }
        >
            {hasActiveCooldown ? (
                <div className="my-8 flex items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                    <Clock className="text-2xl text-[#9146ff]" />
                    <span className="font-mono text-4xl font-bold tabular-nums">{timeLeft}</span>
                </div>
            ) : null}
            <button
                type="button"
                disabled={!ready}
                onClick={() => {
                    clearRateLimitCooldown();
                    window.location.href = window.location.origin;
                }}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#9146ff] px-8 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:border disabled:border-white/5 disabled:bg-[#27272a] disabled:text-[#71717a] disabled:shadow-none"
            >
                {ready ? <RotateCw /> : <Lock />}
                {ready ? 'Volver al inicio' : 'Bloqueado'}
            </button>
        </ErrorPage>
    );
}
