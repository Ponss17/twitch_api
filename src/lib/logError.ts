/** Siempre emite por console.error para que aparezca en la consola del navegador. */
export function logError(scope: string, error: unknown, detail?: string): void {
    if (error instanceof Error) {
        console.error(`[${scope}]${detail ? ` ${detail}` : ''}`, error);
        return;
    }
    console.error(`[${scope}]${detail ? ` ${detail}` : ''}`, error);
}

let globalHandlersInstalled = false;

/** Captura errores no controlados y los deja visibles en consola. */
export function initGlobalErrorLogging(): void {
    if (globalHandlersInstalled || typeof window === 'undefined') return;
    globalHandlersInstalled = true;

    window.addEventListener('error', (event) => {
        logError('Global', event.error ?? event.message, event.filename);
    });

    window.addEventListener('unhandledrejection', (event) => {
        logError('UnhandledPromise', event.reason);
    });
}
