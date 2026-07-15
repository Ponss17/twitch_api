/**
 * Clase base para errores personalizados en la aplicación.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Errores específicos de la API de Twitch.
 */
export class TwitchApiError extends AppError {
    constructor(message: string, statusCode: number = 500) {
        super(message, statusCode);
    }
}

/**
 * Determina si un error desconocido es de autenticación (401).
 * Usa statusCode cuando el error es AppError/TwitchApiError;
 * como fallback detecta mensajes en español del dominio para errores externos.
 *
 * Usar esta función en lugar de `error.message.includes('inválid')` inline.
 */
export function isAuthenticationError(error: unknown): boolean {
    if (error instanceof AppError) return error.statusCode === 401;
    const msg = ((error as Error)?.message) ?? '';
    return (
        msg.includes('inválid') ||
        msg.includes('expirad') ||
        msg.includes('Sesión expirada') ||
        msg.includes('Token expirado')
    );
}
