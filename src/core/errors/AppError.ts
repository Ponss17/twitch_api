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
 * Errores de validación de esquemas (Zod).
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

/**
 * Errores de base de datos / persistencia.
 */
export class DatabaseError extends AppError {
    constructor(message: string, statusCode: number = 500) {
        super(message, statusCode);
    }
}
