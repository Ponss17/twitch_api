import { Response } from 'express';

/** Códigos de error estables para clientes (dashboard, integraciones JSON). */
export type ApiErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED'
    | 'SERVICE_UNAVAILABLE'
    | 'INTERNAL_ERROR'
    | 'MISSING_AUTH'
    | 'INVALID_AUTH'
    | 'AUTH_ALREADY_USED'
    | 'OVERLAY_READ_ONLY'
    | 'ACCOUNT_SUSPENDED'
    | 'MISSING_OVERLAY_TOKEN'
    | 'INVALID_OVERLAY_TOKEN'
    | 'AJAX_REQUIRED'
    | 'API_KEY_NOT_FOUND';

export interface ApiErrorBody {
    success: false;
    error: {
        message: string;
        code: ApiErrorCode;
        details?: unknown;
    };
}

export function httpStatusToErrorCode(status: number): ApiErrorCode {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 429:
            return 'RATE_LIMITED';
        case 503:
            return 'SERVICE_UNAVAILABLE';
        default:
            return status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
    }
}

/** Respuesta de error JSON unificada para dashboard, system y auth exchange. */
export function jsonError(
    res: Response,
    status: number,
    message: string,
    options?: { code?: ApiErrorCode; details?: unknown }
): Response {
    if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return res.status(status).json({
        success: false,
        error: {
            message,
            code: options?.code ?? httpStatusToErrorCode(status),
            ...(options?.details !== undefined ? { details: options.details } : {})
        }
    } satisfies ApiErrorBody);
}

/** Extrae el mensaje de un cuerpo de error (formato nuevo o legacy). */
export function parseApiErrorBody(body: unknown): string | null {
    if (body == null) return null;
    if (typeof body === 'string') return body.trim() || null;

    if (typeof body !== 'object') return null;

    const record = body as Record<string, unknown>;

    if (record.success === false && record.error && typeof record.error === 'object') {
        const nested = record.error as { message?: unknown };
        if (typeof nested.message === 'string' && nested.message.trim()) {
            return nested.message.trim();
        }
    }

    if (typeof record.error === 'string' && record.error.trim()) {
        return record.error.trim();
    }

    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message.trim();
    }

    return null;
}
