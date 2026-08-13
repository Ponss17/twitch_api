import axios from 'axios';
import { apiClient } from '../twitch/twitchClient';
import { CONFIG } from '../../core/config/env';
import { StoredUser } from '../../types/twitch';
import * as dbService from '../../core/database/dbService';
import { logger } from '../../core/utils/logger';
import { AppError } from '../../core/errors/AppError';
import { MESSAGES } from '../../core/config/messages';
import { NegativeCache } from '../../core/utils/boundedCache';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2';

// Para evitar que múltiples peticiones simultáneas refresquen el mismo token (Race Condition)
const refreshPromises = new Map<string, Promise<{ accessToken: string; tokenExpiresAt: number }>>();
const MAX_REFRESH_PROMISES = 100;
const REFRESH_TIMEOUT_MS = 15_000;
/** Margen amplio para renovar el token antes de que expire.
 * 30 minutos garantiza que incluso con CPU throttle en Vercel haya tiempo suficiente. */
const TOKEN_EXPIRY_BUFFER_MS = 30 * 60 * 1000;
/** Tras invalid_grant / sin refresh: no martillar Twitch en cada request. */
const permanentRefreshBlock = new NegativeCache<string>(10 * 60 * 1000, 2000);

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

export const refreshUserToken = async (
    userId: string
): Promise<{ accessToken: string; tokenExpiresAt: number }> => {
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
            const tokenExpiresAt = Date.now() + expires_in * 1000;

            user.accessToken = access_token;
            if (refresh_token) user.refreshToken = refresh_token;
            user.expiresIn = expires_in;
            user.obtainedAt = Date.now();
            user.tokenExpiresAt = tokenExpiresAt;

            await dbService.saveUser(user, { tokensOnly: true });
            permanentRefreshBlock.delete(userId);
            return { accessToken: access_token, tokenExpiresAt };
        } catch (error) {
            if (error instanceof AppError) throw error;
            if (error instanceof Error && error.message.includes('timeout')) {
                logger.error('❌ Timeout renovando token Twitch:', { userId });
                // No 401: timeout ≠ credenciales inválidas (evita tumbar sesión de panel).
                throw new AppError(MESSAGES.AUTH.RENEW_ERROR, 503);
            }
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                logger.error('❌ Error API Twitch (Refresh):', {
                    userId,
                    status,
                    data: error.response?.data,
                    message: error.message
                });
                // 400/401 en /oauth2/token → refresh revocado o cliente mal configurado.
                if (status === 400 || status === 401) {
                    permanentRefreshBlock.set(userId);
                    throw new AppError(MESSAGES.AUTH.NO_REFRESH_TOKEN, 401);
                }
            } else {
                logger.error('❌ Error renovando token:', { userId, error });
            }
            throw new AppError(MESSAGES.AUTH.RENEW_ERROR, 503);
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const RENEW_ATTEMPTS = 3;
const RENEW_RETRY_DELAYS_MS = [400, 1200, 2500] as const;

function isPermanentRefreshFailure(error: unknown): boolean {
    if (!(error instanceof AppError)) return false;
    if (error.statusCode !== 401) return false;
    return (
        error.message === MESSAGES.AUTH.NO_REFRESH_TOKEN ||
        error.message === MESSAGES.AUTH.SESSION_EXPIRED
    );
}

function resolveExpiresAt(user: StoredUser): number {
    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) return user.tokenExpiresAt;
    if (user.obtainedAt && user.expiresIn) return user.obtainedAt + user.expiresIn * 1000;
    return 0;
}

/** Access token usable en Helix: no devolver uno ya vencido. */
export function usableAccessToken(user: StoredUser): string | undefined {
    const expiresAt = resolveExpiresAt(user);
    if (expiresAt > 0 && Date.now() >= expiresAt) return undefined;
    return user.accessToken || undefined;
}

const ensureValidToken = async (
    user: StoredUser,
    errorPrefix: string
): Promise<{ accessToken: string; userId: string; tokenExpiresAt?: number }> => {
    // 30 minutos de buffer: renovar sí o sí antes de que el token expire
    const renewalThreshold = Date.now() + TOKEN_EXPIRY_BUFFER_MS;
    let expiresAt = resolveExpiresAt(user);

    if (!expiresAt) {
        const probed = await probeTokenExpiresAt(user.accessToken);
        if (probed === null) {
            // Sin expires conocidos: forzar intento de renew (no asumir frescura).
            expiresAt = Date.now();
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
        if (permanentRefreshBlock.has(user.userId)) {
            if (Date.now() >= expiresAt) {
                throw new AppError(MESSAGES.AUTH.SESSION_EXPIRED, 401);
            }
            logger.warn(
                `[Auth] Renew bloqueado temporalmente (refresh inválido) para ${errorPrefix} ${user.userId}`
            );
            return {
                accessToken: user.accessToken,
                userId: user.userId,
                tokenExpiresAt: user.tokenExpiresAt && user.tokenExpiresAt > 0 ? user.tokenExpiresAt : undefined
            };
        }

        let lastError: unknown;
        for (let attempt = 0; attempt < RENEW_ATTEMPTS; attempt++) {
            try {
                const renewed = await refreshUserToken(user.userId);
                user.accessToken = renewed.accessToken;
                user.tokenExpiresAt = renewed.tokenExpiresAt;
                logger.info(
                    `[Auth] Twitch token renovado antes de vencer (${errorPrefix} ${user.userId}, intento ${attempt + 1})`
                );
                return {
                    accessToken: renewed.accessToken,
                    userId: user.userId,
                    tokenExpiresAt: renewed.tokenExpiresAt
                };
            } catch (error) {
                lastError = error;
                if (isPermanentRefreshFailure(error)) {
                    permanentRefreshBlock.set(user.userId);
                    break;
                }
                const delay = RENEW_RETRY_DELAYS_MS[attempt];
                if (delay && attempt < RENEW_ATTEMPTS - 1) {
                    logger.warn(
                        `[Auth] Renew falló (intento ${attempt + 1}/${RENEW_ATTEMPTS}) para ${errorPrefix} ${user.userId}; reintento en ${delay}ms`
                    );
                    await sleep(delay);
                }
            }
        }

        if (Date.now() >= expiresAt) {
            logger.error(`Token expirado y refresh falló para ${errorPrefix} ${user.userId}`, lastError);
            throw new AppError(MESSAGES.AUTH.SESSION_EXPIRED, 401);
        }
        logger.warn(
            `Refresh falló tras ${RENEW_ATTEMPTS} intentos pero token aún válido para ${errorPrefix} ${user.userId}; se usará el token actual`
        );
    }

    return {
        accessToken: user.accessToken,
        userId: user.userId,
        tokenExpiresAt: user.tokenExpiresAt && user.tokenExpiresAt > 0 ? user.tokenExpiresAt : undefined
    };
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
): Promise<{ accessToken: string; userId: string; tokenExpiresAt?: number }> => {
    return ensureValidToken(user, 'API Key');
};

export const getValidToken = async (
    apiKey: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new AppError(MESSAGES.AUTH.INVALID_KEY, 401);
    return getValidTokenForUser(user);
};
