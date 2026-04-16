import winston from 'winston';
import Transport from 'winston-transport';
import * as dbService from '../database/dbService';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) msg += `\n${stack}`;
    if (Object.keys(metadata).length > 0 && metadata.details) {
        msg += `\nDetails: ${JSON.stringify(metadata.details, null, 2)}`;
    }
    return msg;
});

// Transporte personalizado para guardar en la base de datos (Supabase)
class DatabaseTransport extends Transport {
    private consecutiveFailures = 0;
    private pausedUntil = 0;

    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info: { level: string; message: string; details?: unknown }, callback: () => void) {
        const { level, message, details } = info;
        if (level === 'error' || level === 'warn') {
            if (Date.now() < this.pausedUntil) {
                callback();
                return;
            }

            dbService
                .addSystemLog(level, message, details as Record<string, unknown>)
                .then(() => {
                    this.consecutiveFailures = 0;
                })
                .catch((err: Error) => {
                    this.consecutiveFailures++;
                    if (this.consecutiveFailures >= 3) {
                        this.pausedUntil = Date.now() + 60_000;
                        this.consecutiveFailures = 0;
                    }
                    console.error('❌ Error saving log to DB:', err);
                });
        }
        callback();
    }
}

const winstonLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize({ all: true }), logFormat)
        }),
        new DatabaseTransport()
    ]
});

// Mantener la interfaz original para compatibilidad total
export const logger = {
    debug: (msg: string, ...args: unknown[]) => {
        winstonLogger.debug(msg, { details: args.length ? args : undefined });
    },
    info: (msg: string, ...args: unknown[]) => {
        winstonLogger.info(msg, { details: args.length ? args : undefined });
    },
    warn: (msg: string, ...args: unknown[]) => {
        winstonLogger.warn(msg, { details: args.length ? args : undefined });
    },
    error: (msg: string, ...args: unknown[]) => {
        winstonLogger.error(msg, { details: args.length ? args : undefined });
    }
};
