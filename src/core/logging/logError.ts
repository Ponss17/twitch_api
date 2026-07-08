/** Siempre emite por console.error para que aparezca en la consola del navegador. */
export function logError(scope: string, error: unknown, detail?: string): void {
    const prefix = `[${scope}]${detail ? ` ${detail}` : ''}`;
    
    if (error instanceof Error) {
        // En Astro/Vite, pasar el objeto de error puro puede causar errores de "circular structure"
        // si el error proviene del backend (ej. fallos de red en SSR con ClientRequest).
        console.error(`${prefix}: ${error.message}\n${error.stack || ''}`);
    } else {
        console.error(prefix, String(error));
    }
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
