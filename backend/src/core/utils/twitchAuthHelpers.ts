import { safeString } from './validationHelpers';
import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import * as authService from '../../features/auth/auth.service';
import { AppError } from '../errors/AppError';
import type { AuthenticatedRequest } from '../../types/twitch';

/** Serializa un error Axios de forma legible para el logger (evita el {} vacío). */
function serializeError(error: unknown): Record<string, unknown> {
    if (axios.isAxiosError(error)) {
        return {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        };
    }
    if (error instanceof Error) {
        const appErr = error as Error & { statusCode?: number };
        return { message: error.message, name: error.name, statusCode: appErr.statusCode };
    }
    return { raw: String(error) };
}

/** Devuelve un mensaje amigable a partir del error de la API de Twitch. */
function friendlyTwitchMessage(error: unknown, defaultMessage: string): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string } | undefined;
        const msg = data?.message || '';

        if (status === 404) return error.message || 'Canal no encontrado.';
        if (status === 422 || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('not live')) {
            return 'El canal está offline. Solo se pueden crear clips en canales en directo.';
        }
        if (status === 403) {
            return 'Sin permiso para crear clips en este canal.';
        }
        if (status === 401) return 'Token expirado o inválido.';
        if (msg) return msg;
    }
    return defaultMessage;
}

export const withTwitchAuth = async <T>(
    req: Request & { twitchToken?: string },
    res: Response,
    action: (token: string) => Promise<T>,
    context: string
): Promise<T> => {
    let token = req.twitchToken;
    const rawApiKey = safeString(req.query.apiKey) || (req.headers['x-api-key'] as string) || '';
    const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim().toLowerCase() : '';

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const result = await action(token || '');
            if (result == null) {
                throw new AppError(`[${context}] La acción de Twitch no devolvió resultado.`, 500);
            }
            return result;
        } catch (error: unknown) {
            const err = error as Error & { status?: number; statusCode?: number; response?: { status?: number } };
            // Los errores pueden llegar como AxiosError (status/response.status)
            // o como TwitchApiError/AppError (statusCode). Hay que checar los tres.
            const httpStatus = err.status ?? err.response?.status ?? err.statusCode;
            const is401 =
                httpStatus === 401 || err.message?.includes('401');

            if (is401 && attempts < maxAttempts) {
                if (apiKey) {
                    logger.warn(`[${context}] 401 detected (attempt ${attempts}), forcing refresh...`);
                    try {
                        const authData = await authService.getValidToken(apiKey);
                        token = authData.accessToken;
                        req.twitchToken = token;
                        continue;
                    } catch (refreshErr) {
                        logger.error(`[${context}] Forced refresh failed:`, refreshErr);
                    }
                } else {
                    const userId = (req as AuthenticatedRequest).userId;
                    if (userId) {
                        logger.warn(
                            `[${context}] 401 detected (attempt ${attempts}), refreshing OAuth for cookie session...`
                        );
                        try {
                            token = await authService.refreshUserToken(userId);
                            req.twitchToken = token;
                            const apiUser = res.locals.apiUser as { accessToken?: string } | undefined;
                            if (apiUser) apiUser.accessToken = token;
                            continue;
                        } catch (refreshErr) {
                            logger.error(`[${context}] OAuth refresh failed:`, refreshErr);
                        }
                    }
                }
            }

            const status = httpStatus || 500;
            const message = friendlyTwitchMessage(error, 'Error processing Twitch request');

            logger.error(`[${context} ERROR]`, { attempt: attempts, error: serializeError(error) });

            if (is401) {
                throw new AppError('Error de autenticación. Token expirado.', 401);
            } else {
                throw new AppError(message, status);
            }
        }
    }
    
    throw new AppError('Error de autenticación. Token expirado.', 401);
};
