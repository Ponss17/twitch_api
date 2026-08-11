import winston from 'winston';
import Transport from 'winston-transport';
import { waitUntil } from '@vercel/functions';
import { addSystemLog } from '../database/systemLogService';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { sanitizeLogValue } from './logSanitizer';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const asyncContext = new AsyncLocalStorage<Map<string, string>>();

export { asyncContext };

export function generateRequestId(): string {
    return `req_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export function setRequestId(reqId: string): void {
    const store = asyncContext.getStore();
    if (store) {
        store.set('requestId', reqId);
    }
}

export function getRequestId(): string | undefined {
    return asyncContext.getStore()?.get('requestId');
}

export function clearRequestId(): void {
    asyncContext.getStore()?.delete('requestId');
}

// Formato para desarrollo: legible y coloreado
const devFormat = printf(({ level, message, timestamp, stack, requestId, ...metadata }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) msg += ` {${requestId}}`;
    msg += `: ${message}`;
    if (stack) msg += `\n${stack}`;
    if (Object.keys(metadata).length > 0 && metadata.details) {
        msg += `\nDetails: ${JSON.stringify(metadata.details, null, 2)}`;
    }
    return msg;
});

// Formato para producción: JSON estructurado
const prodFormat = combine(
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    errors({ stack: true }),
    json({
        space: 0,
        replacer: (_key, value) => sanitizeLogValue(value)
    })
);

// Transporte personalizado para guardar en la base de datos (Supabase)
class DatabaseTransport extends Transport {
    private consecutiveFailures = 0;
    private pausedUntil = 0;

    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(
        info: { level: string; message: string; details?: unknown; requestId?: string },
        callback: () => void
    ) {
        const { level, message, details, requestId } = info;
        if (level === 'error' || level === 'warn') {
            if (Date.now() < this.pausedUntil) {
                callback();
                return;
            }

            // Estructurar el log para la base de datos
            const logEntry = {
                message,
                details: sanitizeLogValue(details) as Record<string, unknown>,
                requestId,
                timestamp: new Date().toISOString()
            };

            const persistence = addSystemLog(level as 'error' | 'warn', message, logEntry)
                .then(() => {
                    this.consecutiveFailures = 0;
                })
                .catch(() => {
                    this.consecutiveFailures++;
                    if (this.consecutiveFailures >= 3) {
                        // Circuit breaker: pausar por 60 segundos después de 3 fallos
                        this.pausedUntil = Date.now() + 60_000;
                        this.consecutiveFailures = 0;
                    }
                    // El transporte Console ya emitió el evento sanitizado a stdout.
                    console.error('System log persistence failed; retained in stdout');
                });
            if (isVercel) {
                try {
                    waitUntil(persistence);
                } catch {
                    // Fuera de un request de Vercel, la promesa sigue activa como fallback local.
                }
            }
        }
        callback();
    }
}

// Determinar nivel de log según entorno
const getLogLevel = (): string => {
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel && ['error', 'warn', 'info', 'debug'].includes(envLevel)) {
        return envLevel;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

// Crear el logger de Winston con formato según entorno
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

const winstonLogger = winston.createLogger({
    level: getLogLevel(),
    format: isProduction
        ? prodFormat
        : combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
    defaultMeta: {
        service: 'losperris-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '5.0.0',
        ...(isVercel && {
            vercelEnv: process.env.VERCEL_ENV,
            vercelRegion: process.env.VERCEL_REGION,
            vercelDeployment: process.env.VERCEL_URL
        })
    },
    transports: [
        new winston.transports.Console({
            format: isProduction
                ? prodFormat
                : combine(
                      colorize({ all: true }),
                      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                      devFormat
                  )
        }),
        new DatabaseTransport()
    ]
});

// Función helper para enriquecer logs con metadata
const enrichLog = (level: string, msg: string, args: unknown[]): Record<string, unknown> => {
    const meta: Record<string, unknown> = {};

    // Agregar requestId si existe en el contexto
    const requestId = getRequestId();
    if (requestId) {
        meta.requestId = requestId;
    }

    // Procesar argumentos
    if (args.length > 0) {
        // Si el primer argumento es un objeto, extraer metadata
        if (typeof args[0] === 'object' && args[0] !== null) {
            const firstArg = sanitizeLogValue(args[0]) as Record<string, unknown>;

            if (firstArg.requestId) {
                meta.requestId = firstArg.requestId;
                delete firstArg.requestId;
            }
            if (firstArg.userId) {
                meta.userId = firstArg.userId;
            }
            if (firstArg.endpoint) {
                meta.endpoint = firstArg.endpoint;
            }
            if (firstArg.method) {
                meta.method = firstArg.method;
            }
            if (firstArg.duration !== undefined) {
                meta.duration = firstArg.duration;
            }
            if (firstArg.statusCode) {
                meta.statusCode = firstArg.statusCode;
            }

            // El resto va a details
            if (Object.keys(firstArg).length > 0) {
                meta.details = firstArg;
            }
        } else {
            meta.details = sanitizeLogValue(args);
        }
    }

    return meta;
};

// Interfaz mejorada del logger con soporte para estructurado
export const logger = {
    /**
     * Log nivel debug - solo en desarrollo
     */
    debug: (msg: string, ...args: unknown[]) => {
        const meta = enrichLog('debug', msg, args);
        winstonLogger.debug(msg, meta);
    },

    /**
     * Log nivel info - información general
     */
    info: (msg: string, ...args: unknown[]) => {
        const meta = enrichLog('info', msg, args);
        winstonLogger.info(msg, meta);
    },

    /**
     * Log nivel warn - advertencias
     */
    warn: (msg: string, ...args: unknown[]) => {
        const meta = enrichLog('warn', msg, args);
        winstonLogger.warn(msg, meta);
    },

    /**
     * Log nivel error - errores
     */
    error: (msg: string, ...args: unknown[]) => {
        const meta = enrichLog('error', msg, args);
        winstonLogger.error(msg, meta);
    },

    /**
     * Log de inicio de request con correlación
     */
    startRequest: (method: string, url: string, userId?: string, suppliedRequestId?: string) => {
        const requestId = suppliedRequestId || generateRequestId();
        setRequestId(requestId);

        const isPollingRoute =
            url.includes('/overlay-state/') ||
            url.includes('/health') ||
            url.includes('/activity/') ||
            url.includes('/summary/') ||
            url.includes('/user-info/') ||
            url.includes('/realtime-token/');

        if (!isPollingRoute) {
            winstonLogger.info(`→ Request started: [${method}] ${url}`, {
                requestId,
                method,
                endpoint: url,
                userId
            });
        }

        return requestId;
    }
};
