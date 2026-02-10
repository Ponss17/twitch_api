import { addSystemLog } from '../services/infrastructure/dbService';

const symbols = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🐛'
};

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
    debug: (...args: unknown[]) => {
        if (isDev) console.log('[DEBUG]', ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
        console.log(`${symbols.info} [INFO]`, msg, ...args);
        addSystemLog('info', msg, args.length ? args : undefined);
    },
    warn: (msg: string, ...args: unknown[]) => {
        console.warn(`${symbols.warn} [WARN]`, msg, ...args);
        addSystemLog('warn', msg, args.length ? args : undefined);
    },
    error: (msg: string, ...args: unknown[]) => {
        console.error(`${symbols.error} [ERROR]`, msg, ...args);
        addSystemLog('error', msg, args.length ? args : undefined);
    }
};
