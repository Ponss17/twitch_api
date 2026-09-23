import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 90_000;
const RETRY_MS = 12_000;
/** Evita falsos positivos (proxy/dev, cold start, abort de Strict Mode). */
const FAILURES_BEFORE_BANNER = 2;

export type ApiHealthStatus = 'ok' | 'down' | 'checking';

const PROBE_URLS = [
    '/api/health/',
    '/api/health',
    '/api/system/health/?probe=live',
    '/health'
] as const;

function isAbortError(err: unknown): boolean {
    return (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
    );
}

async function probeOnce(url: string, signal?: AbortSignal): Promise<boolean> {
    const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        signal,
        headers: { Accept: 'application/json' }
    });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    // Astro 404 HTML no cuenta como API sana.
    if (type.includes('text/html')) return false;
    return true;
}

async function probeLive(signal?: AbortSignal): Promise<'ok' | 'down' | 'aborted'> {
    try {
        for (const url of PROBE_URLS) {
            if (signal?.aborted) return 'aborted';
            try {
                if (await probeOnce(url, signal)) return 'ok';
            } catch (err) {
                if (isAbortError(err) || signal?.aborted) return 'aborted';
            }
        }
        return 'down';
    } catch (err) {
        if (isAbortError(err) || signal?.aborted) return 'aborted';
        return 'down';
    }
}

/** Poll ligero de liveness para el aviso discreto del panel. */
export function useApiHealth(enabled = true): {
    status: ApiHealthStatus;
    check: () => Promise<void>;
} {
    const [status, setStatus] = useState<ApiHealthStatus>('ok');
    const acRef = useRef<AbortController | null>(null);
    const failuresRef = useRef(0);

    const check = useCallback(async () => {
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        setStatus((prev) => (prev === 'down' ? 'checking' : prev));
        const result = await probeLive(ac.signal);
        if (ac.signal.aborted || result === 'aborted') return;

        if (result === 'ok') {
            failuresRef.current = 0;
            setStatus('ok');
            return;
        }

        failuresRef.current += 1;
        if (failuresRef.current >= FAILURES_BEFORE_BANNER) {
            setStatus('down');
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Primera comprobación un poco diferida: evita ruido al montar el panel.
        const boot = window.setTimeout(() => {
            void check();
        }, 2_500);
        const id = window.setInterval(() => {
            void check();
        }, POLL_MS);

        return () => {
            clearTimeout(boot);
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
