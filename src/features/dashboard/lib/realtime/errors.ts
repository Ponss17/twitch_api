export function isTransportFailure(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return /transport failure|connection refused|websocket|NS_ERROR_WEBSOCKET/i.test(message);
}

let pageIsUnloading = false;
let unloadGuardInstalled = false;

export function installUnloadGuard(): void {
    if (unloadGuardInstalled || typeof window === 'undefined') return;
    unloadGuardInstalled = true;
    const markUnloading = () => {
        pageIsUnloading = true;
    };
    window.addEventListener('beforeunload', markUnloading);
    window.addEventListener('pagehide', markUnloading);
}

export function isPageUnloading(): boolean {
    return pageIsUnloading;
}

export function isBenignRealtimeClose(err: unknown, intentionalClose: boolean): boolean {
    if (pageIsUnloading || intentionalClose) return true;
    if (!err) return false;

    const message = err instanceof Error ? err.message : String(err);
    if (/1000|1001|going away|socket closed/i.test(message)) return true;
    if (/interrupted|page load|NS_ERROR|network/i.test(message)) return true;

    const cause = err instanceof Error ? (err as Error & { cause?: { code?: number } }).cause : undefined;
    if (cause && typeof cause === 'object' && typeof cause.code === 'number') {
        return cause.code === 1000 || cause.code === 1001;
    }

    return false;
}

export function waitForStablePage(): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();
    if (document.readyState === 'complete') {
        return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    return new Promise((resolve) => {
        window.addEventListener(
            'load',
            () => requestAnimationFrame(() => resolve()),
            { once: true }
        );
    });
}
