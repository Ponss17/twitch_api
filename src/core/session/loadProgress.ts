export type SessionLoadProgressDetail = {
    progress: number;
    label: string;
    cached?: boolean;
};

export const SESSION_LOAD_EVENT = 'session-load:progress';

export function reportSessionLoadProgress(detail: SessionLoadProgressDetail): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<SessionLoadProgressDetail>(SESSION_LOAD_EVENT, { detail }));
}

export function subscribeSessionLoadProgress(
    listener: (detail: SessionLoadProgressDetail) => void
): () => void {
    if (typeof window === 'undefined') return () => undefined;

    const handler = (event: Event) => {
        listener((event as CustomEvent<SessionLoadProgressDetail>).detail);
    };

    window.addEventListener(SESSION_LOAD_EVENT, handler);
    return () => window.removeEventListener(SESSION_LOAD_EVENT, handler);
}

export function resetSessionLoadProgress(): void {
    reportSessionLoadProgress({
        progress: 0,
        label: 'Iniciando…',
        cached: false
    });
}
