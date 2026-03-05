import * as dbService from '../database/dbService';

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
    },
    warn: (msg: string, ...args: unknown[]) => {
        console.warn(`${symbols.warn} [WARN]`, msg, ...args);
        dbService.addSystemLog('warn', msg, args.length ? { details: args } : undefined);
    },
    error: (msg: string, ...args: unknown[]) => {
        console.error(`${symbols.error} [ERROR]`, msg, ...args);
        dbService.addSystemLog('error', msg, args.length ? { details: args } : undefined);
    }
};
