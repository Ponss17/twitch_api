import axios from 'axios';
import { CONFIG } from '../../core/config/env';
import { TwitchUser, StoredUser } from '../../types/twitch';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import crypto from 'crypto';
import { logger } from '../../core/utils/logger';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2';
const TWITCH_API_URL = 'https://api.twitch.tv/helix';

const signState = (payload: object): string => {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const secret = CONFIG.TWITCH_CLIENT_SECRET as string;
    const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return `${data}.${sig}`;
};

export const verifyState = (state: string): Record<string, unknown> | null => {
    const lastDot = state.lastIndexOf('.');
    if (lastDot === -1) return null;
    const data = state.slice(0, lastDot);
    const sig = state.slice(lastDot + 1);
    const secret = CONFIG.TWITCH_CLIENT_SECRET as string;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    try {
        return JSON.parse(Buffer.from(data, 'base64').toString());
    } catch {
        return null;
    }
};

export const getAuthorizeUrl = (
    redirectOrigin: string,
    extraData?: Record<string, unknown>
): string => {
    const scope =
        'user:read:email moderator:read:followers clips:edit moderator:read:chatters user:write:chat chat:read chat:edit';
    const state = signState({ redirectOrigin, ...extraData });

    const params = new URLSearchParams({
        client_id: CONFIG.TWITCH_CLIENT_ID as string,
        redirect_uri: CONFIG.TWITCH_REDIRECT_URI as string,
        response_type: 'code',
        scope: scope,
        state: state
    });

    return `${TWITCH_AUTH_URL}/authorize?${params.toString()}`;
};

export const handleCallback = async (
    code: string,
    state: string,
    decodedState?: Record<string, unknown> | null
): Promise<{
    user: TwitchUser;
    access_token: string;
    redirectOrigin: string;
    apiKey: string;
    isAdmin: boolean;
}> => {
    const tokenResponse = await axios.post(`${TWITCH_AUTH_URL}/token`, null, {
        params: {
            client_id: CONFIG.TWITCH_CLIENT_ID,
            client_secret: CONFIG.TWITCH_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: CONFIG.TWITCH_REDIRECT_URI
        }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get(`${TWITCH_API_URL}/users`, {
        headers: {
            'Client-ID': CONFIG.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${access_token}`
        }
    });

    const user = userResponse.data.data[0] as TwitchUser;

    let apiKey: string = crypto.randomUUID();
    const existingUser = await dbService.getUser(user.id);
    if (existingUser && existingUser.apiKey) {
        apiKey = existingUser.apiKey;
    }

    const storedUser: StoredUser = {
        userId: user.id,
        login: user.login,
        displayName: user.display_name,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        obtainedAt: Date.now(),
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        apiKey,
        profileImageUrl: user.profile_image_url,
        isActive: existingUser?.isActive ?? true,
        blockedReason: existingUser?.blockedReason,
        customRateLimit: existingUser?.customRateLimit,
        stats: existingUser?.stats,
        totalRequests: existingUser?.totalRequests,
        lastActive: existingUser?.lastActive,
        timezone: (decodedState?.tz as string) || existingUser?.timezone || 'UTC'
    };

    if (!refresh_token) {
        logger.warn(
            '⚠ ADVERTENCIA: No se recibió Refresh Token de Twitch. La sesión no se renovará automáticamente.'
        );
    }

    await dbService.saveUser(storedUser);

    let redirectOrigin = '';
    let isAdmin = false;
    if (state) {
        const decoded = decodedState ?? verifyState(state);
        if (!decoded) {
            logger.warn('⚠ OAuth state inválido o manipulado. Ignorando redirectOrigin.');
        } else {
            redirectOrigin = (decoded.redirectOrigin as string) || '';
            isAdmin = decoded.isAdmin === true;
        }
    }

    return { user, access_token, redirectOrigin, apiKey, isAdmin };
};

// Para evitar que múltiples peticiones simultáneas refresquen el mismo token (Race Condition)
const refreshPromises = new Map<string, Promise<string>>();
const MAX_REFRESH_PROMISES = 100;
const REFRESH_TIMEOUT_MS = 15_000;

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
            throw new Error('Usuario no encontrado o sin refresh token');
        }

        try {
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error('Token refresh timeout (15s)')),
                    REFRESH_TIMEOUT_MS
                )
            );

            const refreshRequest = axios.post(`${TWITCH_AUTH_URL}/token`, null, {
                params: {
                    client_id: CONFIG.TWITCH_CLIENT_ID,
                    client_secret: CONFIG.TWITCH_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: user.refreshToken
                }
            });

            const response = await Promise.race([refreshRequest, timeoutPromise]);

            const { access_token, refresh_token, expires_in } = response.data;

            user.accessToken = access_token;
            if (refresh_token) user.refreshToken = refresh_token;
            user.expiresIn = expires_in;
            user.obtainedAt = Date.now();

            await dbService.saveUser(user);
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
            throw new Error('No se pudo renovar el token. Relogueate.');
        } finally {
            refreshPromises.delete(userId);
        }
    })();

    refreshPromises.set(userId, refreshTask);
    return refreshTask;
};

const ensureValidToken = async (
    user: StoredUser,
    errorPrefix: string
): Promise<{ accessToken: string; userId: string }> => {
    const expiresAt = user.obtainedAt + user.expiresIn * 1000;
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

    if (fiveMinutesFromNow > expiresAt) {
        try {
            const newToken = await refreshUserToken(user.userId);
            return { accessToken: newToken, userId: user.userId };
        } catch (_error) {
            if (Date.now() > expiresAt) {
                logger.error(`Token expirado y refresh falló para ${errorPrefix} ${user.userId}`);
                throw new Error('Sesión expirada. Por favor, vuelve a autenticarte.');
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
    if (!user) throw new Error('Usuario no encontrado en la base de datos');
    return ensureValidToken(user, `login ${login}`);
};

export const getValidToken = async (
    apiKey: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new Error('API Key inválida');
    return ensureValidToken(user, `API Key`);
};

let _invalidateCacheFn: ((userId: string) => void) | null = null;

export const registerCacheInvalidator = (fn: (userId: string) => void): void => {
    _invalidateCacheFn = fn;
};

export const regenerateApiKey = async (userId: string): Promise<string> => {
    const user = await dbService.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const oldApiKey = user.apiKey;
    const newApiKey = crypto.randomUUID();
    user.apiKey = newApiKey;

    await dbService.saveUser(user);

    // Invalidar caché en memoria y en KV para que la clave vieja deje de funcionar de inmediato
    _invalidateCacheFn?.(userId);
    if (oldApiKey) {
        cacheService
            .invalidateApiKeyCache(oldApiKey)
            .catch((e) => logger.error('Error invalidate KV api key cache:', e));
    }

    return newApiKey;
};
