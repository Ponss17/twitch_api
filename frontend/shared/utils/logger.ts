export const Logger = {
    log(...args: unknown[]) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log(...args);
        }
    },

    warn(...args: unknown[]) {
        console.warn(...args);
    },

    error(...args: unknown[]) {
        console.error(...args);
    }
};
