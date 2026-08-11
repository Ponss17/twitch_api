import axios from 'axios';
import { apiClient } from '../twitch/twitchClient';
import { CONFIG } from '../../core/config/env';
import { StoredUser } from '../../types/twitch';
import * as dbService from '../../core/database/dbService';
import { logger } from '../../core/utils/logger';
import { AppError } from '../../core/errors/AppError';
import { MESSAGES } from '../../core/config/messages';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2';

// Para evitar que múltiples peticiones simultáneas refresquen el mismo token (Race Condition)
const refreshPromises = new Map<string, Promise<string>>();
const MAX_REFRESH_PROMISES = 100;
const REFRESH_TIMEOUT_MS = 15_000;
/** Margen amplio para renovar el token antes de que expire.
 * 30 minutos garantiza que incluso con CPU throttle en Vercel haya tiempo suficiente. */
const TOKEN_EXPIRY_BUFFER_MS = 30 * 60 * 1000;

export function isOAuthTokenNearExpiry(
    user: StoredUser,
    bufferMs: number = TOKEN_EXPIRY_BUFFER_MS
): boolean {
    let expiresAt = 0;
    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        expiresAt = user.tokenExpiresAt;
    } else if (user.obtainedAt && user.expiresIn) {
        expiresAt = user.obtainedAt + user.expiresIn * 1000;
    }
    if (!expiresAt) return false;
    return Date.now() + bufferMs > expiresAt;
}

export const refreshUserToken = async (userId: string): Promise<string> => {
    if (refreshPromises.has(userId)) {
        logger.info(`[Auth] Reusing existing refresh promise for user ${userId}`);
        return refreshPromises.get(userId)!;
    }

    if (refreshPromises.size >= MAX_REFRESH_PROMISES) {
        const first = refreshPromises.keys().next().value;
        if (first) refreshPromises.delete(first);
    }

    const refreshTask = (async () => {
        const user = await dbService.getUser(userId);
        if (!user || !user.refreshToken) {
            logger.error(`❌ Error renovando token: Usuario ${userId} no tiene Refresh Token.`);
            throw new AppError(MESSAGES.AUTH.NO_REFRESH_TOKEN, 401);
        }

        let timeoutId: NodeJS.Timeout | undefined;
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Token refresh timeout (15s)')),
                    REFRESH_TIMEOUT_MS
                );
            });

            const params = new URLSearchParams({
                client_id: CONFIG.TWITCH_CLIENT_ID as string,
                client_secret: CONFIG.TWITCH_CLIENT_SECRET as string,
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken
            });

            const refreshRequest = apiClient.post(`${TWITCH_AUTH_URL}/token`, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const response = await Promise.race([refreshRequest, timeoutPromise]);

            const { access_token, refresh_token, expires_in } = response.data;

            user.accessToken = access_token;
            if (refresh_token) user.refreshToken = refresh_token;
            user.expiresIn = expires_in;
            user.obtainedAt = Date.now();
            user.tokenExpiresAt = Date.now() + expires_in * 1000;

            await dbService.saveUser(user, { tokensOnly: true });
            return access_token;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('❌ Error API Twitch (Refresh):', {
                    userId,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                logger.error('❌ Error renovando token:', { userId, error });
            }
            throw new AppError(MESSAGES.AUTH.RENEW_ERROR, 401);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            refreshPromises.delete(userId);
        }
    })();

    refreshPromises.set(userId, refreshTask);
    return refreshTask;
};

/**
 * Consulta el endpoint /oauth2/validate de Twitch para conocer el `expires_in` real
 * cuando la expiración no está persistida (legacy: obtainedAt/expiresIn = 0).
 * - 401 → token revocado/expirado → devuelve 0 (forzar refresh).
 * - error transitorio (red/timeout) → devuelve null (no forzar refresh innecesario).
 */
const probeTokenExpiresAt = async (accessToken: string): Promise<number | null> => {
    try {
        const res = await apiClient.get(`${TWITCH_AUTH_URL}/validate`, {
            headers: { Authorization: `OAuth ${accessToken}` },
            timeout: 8000
        });
        return Date.now() + (Number(res.data?.expires_in) || 0) * 1000;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return 0;
        }
        return null;
    }
};

const ensureValidToken = async (
    user: StoredUser,
    errorPrefix: string
): Promise<{ accessToken: string; userId: string }> => {
    // 30 minutos de buffer: renovar mucho antes de que el token expire
    const renewalThreshold = Date.now() + TOKEN_EXPIRY_BUFFER_MS;
    let expiresAt = 0;

    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        expiresAt = user.tokenExpiresAt;
    } else if (user.obtainedAt && user.expiresIn) {
        expiresAt = user.obtainedAt + user.expiresIn * 1000;
    }

    if (!expiresAt) {
        const probed = await probeTokenExpiresAt(user.accessToken);
        if (probed === null) {
            expiresAt = Date.now() + 10 * 60 * 1000;
        } else {
            expiresAt = probed;
            if (probed > 0) {
                user.tokenExpiresAt = probed;
                void dbService.saveUser(user, { tokensOnly: true }).catch((e) =>
                    logger.warn('No se pudo persistir token_expires_at:', e)
                );
            }
        }
    }

    if (renewalThreshold > expiresAt) {
        try {
            const newToken = await refreshUserToken(user.userId);
            return { accessToken: newToken, userId: user.userId };
        } catch (_error) {
            if (Date.now() > expiresAt) {
                logger.error(`Token expirado y refresh falló para ${errorPrefix} ${user.userId}`);
                throw new AppError(MESSAGES.AUTH.SESSION_EXPIRED, 401);
            }
            logger.warn(
                `Refresh falló pero token aún válido para ${errorPrefix} ${user.userId}, usando token actual`
            );
        }
    }

    return { accessToken: user.accessToken, userId: user.userId };
};

export const getValidTokenByLogin = async (
    login: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByLogin(login);
    if (!user) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, 404);
    return ensureValidToken(user, `login ${login}`);
};

export const getValidTokenForUser = async (
    user: StoredUser
): Promise<{ accessToken: string; userId: string }> => {
    return ensureValidToken(user, 'API Key');
};

export const getValidToken = async (
    apiKey: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new AppError(MESSAGES.AUTH.INVALID_KEY, 401);
    return getValidTokenForUser(user);
};
