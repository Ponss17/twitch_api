export const Logger = {
    log(...args: any[]) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log(...args);
        }
    },

    warn(...args: any[]) {
        console.warn(...args);
    },

    error(...args: any[]) {
        console.error(...args);
    }
};
