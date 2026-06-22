import { useEffect, useState } from 'react';
import { ErrorPage } from '@/components/errors/ErrorPage';

export function RateLimitPage() {
    const [timeLeft, setTimeLeft] = useState('05:00');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const COOLDOWN_MINUTES = 5;
        let cooldownEnd = localStorage.getItem('rate_limit_cooldown');
        const now = Date.now();

        if (!cooldownEnd || parseInt(cooldownEnd) < now) {
            cooldownEnd = String(now + COOLDOWN_MINUTES * 60 * 1000);
            localStorage.setItem('rate_limit_cooldown', cooldownEnd);
        }

        const end = parseInt(cooldownEnd);

        const tick = () => {
            const left = end - Date.now();
            if (left <= 0) {
                setTimeLeft('00:00');
                setReady(true);
                localStorage.removeItem('rate_limit_cooldown');
                return;
            }
            const m = Math.floor(left / 60000);
            const s = Math.floor((left % 60000) / 1000);
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            requestAnimationFrame(tick);
        };
        tick();
    }, []);

    return (
        <ErrorPage
            code="Seguridad"
            title="¡Wow, vas muy rápido!"
            message="Has excedido el límite de peticiones. Por seguridad, hemos activado un breve periodo de espera."
        >
            <div className="my-8 flex items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <i className="fa-regular fa-clock text-2xl text-[#9146ff]" />
                <span className="font-mono text-4xl font-bold tabular-nums">{timeLeft}</span>
            </div>
            <button
                type="button"
                disabled={!ready}
                onClick={() => window.location.reload()}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#9146ff] px-8 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:border disabled:border-white/5 disabled:bg-[#27272a] disabled:text-[#71717a] disabled:shadow-none"
            >
                <i className={`fa-solid ${ready ? 'fa-rotate-right' : 'fa-lock'}`} />
                {ready ? 'Intentar de nuevo' : 'Bloqueado'}
            </button>
        </ErrorPage>
    );
}
