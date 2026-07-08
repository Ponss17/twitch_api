import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import * as authService from '../../features/auth/auth.service';
import { AppError } from '../errors/AppError';

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
        return { message: error.message, name: error.name };
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
    const apiKey = (req.query.apiKey as string) || (req.headers['x-api-key'] as string);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            return await action(token || '');
        } catch (error: unknown) {
            const err = error as Error & { status?: number; response?: { status?: number } };
            const is401 =
                err.message?.includes('401') || err.status === 401 || err.response?.status === 401;

            if (is401 && apiKey && attempts < maxAttempts) {
                logger.warn(`[${context}] 401 detected (attempt ${attempts}), forcing refresh...`);
                try {
                    const authData = await authService.getValidToken(apiKey);
                    token = authData.accessToken;
                    continue;
                } catch (refreshErr) {
                    logger.error(`[${context}] Forced refresh failed:`, refreshErr);
                }
            }

            const status = err.status || err.response?.status || 500;
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
