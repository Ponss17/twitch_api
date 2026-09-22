import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 75_000;
const RETRY_MS = 8_000;

export type ApiHealthStatus = 'ok' | 'down' | 'checking';

async function probeLive(signal?: AbortSignal): Promise<boolean> {
    try {
        const res = await fetch('/health?probe=live', {
            method: 'GET',
            cache: 'no-store',
            signal
        });
        return res.ok;
    } catch {
        return false;
    }
}

/** Poll ligero de liveness para el banner del panel. */
export function useApiHealth(enabled = true): {
    status: ApiHealthStatus;
    check: () => Promise<void>;
} {
    const [status, setStatus] = useState<ApiHealthStatus>('ok');
    const acRef = useRef<AbortController | null>(null);

    const check = useCallback(async () => {
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;
        setStatus((prev) => (prev === 'down' ? 'checking' : prev));
        const ok = await probeLive(ac.signal);
        if (ac.signal.aborted) return;
        setStatus(ok ? 'ok' : 'down');
    }, []);

    useEffect(() => {
        if (!enabled) return;

        void check();
        const id = window.setInterval(() => {
            void check();
        }, POLL_MS);

        return () => {
            clearInterval(id);
            acRef.current?.abort();
        };
    }, [enabled, check]);

    useEffect(() => {
        if (!enabled || status !== 'down') return;
        const id = window.setInterval(() => {
            void check();
        }, RETRY_MS);
        return () => clearInterval(id);
    }, [enabled, status, check]);

    return { status, check };
}
