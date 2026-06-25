/** Logs de depuración — solo en desarrollo (no en test ni producción). */
const isDev =
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development';

export function debugLog(...args: unknown[]): void {
    if (isDev) {
        console.log(...args);
    }
}

export function debugWarn(...args: unknown[]): void {
    if (isDev) {
        console.warn(...args);
    }
}
