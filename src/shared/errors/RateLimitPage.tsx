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
                <div className="my-6 flex items-center justify-center gap-4 rounded-xl border border-border-subtle bg-bg-card/40 px-6 py-4">
                    <Clock className="h-6 w-6 text-brand-text" />
                    <span className="font-mono text-3xl font-bold tabular-nums text-text-main">{timeLeft}</span>
                </div>
            ) : null}
            <button
                type="button"
                disabled={!ready}
                onClick={() => {
                    clearRateLimitCooldown();
                    window.location.href = window.location.origin;
                }}
                className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:border disabled:border-border-subtle disabled:bg-bg-secondary disabled:text-text-muted disabled:shadow-none disabled:hover:scale-100"
            >
                {ready ? <RotateCw className="size-4" /> : <Lock className="size-4" />}
                {ready ? 'Volver al inicio' : 'Bloqueado'}
            </button>
        </ErrorPage>
    );
}
