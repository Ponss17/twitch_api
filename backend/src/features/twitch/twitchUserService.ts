import { TwitchUser, TwitchValidationResponse } from '../../types/twitch';
import * as cacheService from '../../core/database/cacheService';
import { getTimePhraseBetween } from '../../core/utils/time';
import { TwitchApiError } from '../../core/errors/AppError';
import { logger } from '../../core/utils/logger';
import {
    apiClient,
    checkCircuit,
    recordSuccess,
    handleTwitchError,
    getHeaders
} from './twitchClient';
import axios from 'axios';

const userInfoCache = new Map<string, { data: TwitchUser; expiry: number }>();
const MAX_USER_INFO_CACHE = 200;
const USER_INFO_TTL = 30_000;

export const getUserId = async (username: string, token: string): Promise<string> => {
    try {
        const cachedId = await cacheService.getCachedUserId(username);
        if (cachedId) return cachedId;

        const user = await getUserInfo(username, token);
        await cacheService.setCachedUserId(username, user.id);
        return user.id;
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getUserId(${username})`);
    }
};

export const getUserInfo = async (username: string, token: string): Promise<TwitchUser> => {
    const cached = userInfoCache.get(username.toLowerCase());
    if (cached && cached.expiry > Date.now()) return cached.data;

    await checkCircuit();
    const headers = getHeaders(token);
    
    try {
        const response = await apiClient.get(
            `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
            {
                headers
            }
        );

        if (response.data.data.length === 0) {
            throw new TwitchApiError(`El usuario/canal ${username} no existe.`, 404);
        }

        recordSuccess();
        const user = response.data.data[0];

        if (userInfoCache.size >= MAX_USER_INFO_CACHE) {
            const first = userInfoCache.keys().next().value;
            if (first) userInfoCache.delete(first);
        }
        userInfoCache.set(username.toLowerCase(), { data: user, expiry: Date.now() + USER_INFO_TTL });

        return user;
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getUserInfo(${username})`);
    }
};

export function invalidateUserInfoCache(login?: string, userId?: string): void {
    if (login) {
        userInfoCache.delete(login.toLowerCase());
    }
    if (userId) {
        for (const key of [...userInfoCache.keys()]) {
            const entry = userInfoCache.get(key);
            if (entry?.data.id === userId) {
                userInfoCache.delete(key);
            }
        }
    }
}

export type FollowAgeResult = {
    text: string;
    timePhrase: string;
    followDateMs?: number;
};

const followageError = (text: string): FollowAgeResult => ({
    text,
    timePhrase: 'error'
});

async function resolveFollowageLoginId(
    login: string,
    token: string,
    label: 'canal' | 'usuario'
): Promise<string | FollowAgeResult> {
    try {
        return await getUserId(login, token);
    } catch (error) {
        if (error instanceof TwitchApiError && error.statusCode === 404) {
            return followageError(
                label === 'canal'
                    ? `El canal "${login}" no existe en Twitch. Revisa que el nombre esté bien escrito.`
                    : `El usuario "${login}" no existe en Twitch. Revisa que el nombre esté bien escrito.`
            );
        }
        throw error;
    }
}

function mapFollowageHelixError(
    error: unknown,
    channel: string,
    user: string
): FollowAgeResult | null {
    const status = axios.isAxiosError(error)
        ? error.response?.status
        : error instanceof TwitchApiError
          ? error.statusCode
          : undefined;

    if (status === 404) {
        const twitchMsg = axios.isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : error instanceof TwitchApiError
              ? error.message
              : undefined;
        return followageError(twitchMsg || `No se encontró información de follow para ${user} en ${channel}.`);
    }

    if (status === 401 || status === 403) {
        return followageError(
            `No se puede consultar el follow en "${channel}". El parámetro channel debe ser el login de TU canal (dueño de la API key).`
        );
    }

    if (status === 503 || (error instanceof TwitchApiError && error.statusCode === 503)) {
        return followageError('Twitch no está disponible ahora mismo. Intenta en unos segundos.');
    }

    return null;
}

export const getFollowAge = async (
    channel: string,
    user: string,
    token: string
): Promise<FollowAgeResult> => {
    try {
        const channelId = await resolveFollowageLoginId(channel, token, 'canal');
        if (typeof channelId !== 'string') return channelId;

        const userId = await resolveFollowageLoginId(user, token, 'usuario');
        if (typeof userId !== 'string') return userId;

        if (channelId === userId) {
            return {
                text: `${user} es el dueño del canal.`,
                timePhrase: 'toda la vida'
            };
        }

        const headers = getHeaders(token);
        const followRes = await apiClient.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: {
                broadcaster_id: channelId,
                user_id: userId
            }
        });

        if (followRes.data.data.length === 0) {
            return {
                text: `${user} no sigue a ${channel}.`,
                timePhrase: 'no sigue'
            };
        }

        const followDate = new Date(followRes.data.data[0].followed_at);
        const timePhrase = getTimePhraseBetween(followDate);

        return {
            text: `${user} ha seguido a ${channel} por ${timePhrase}.`,
            timePhrase,
            followDateMs: followDate.getTime()
        };
    } catch (error: unknown) {
        const mapped = mapFollowageHelixError(error, channel, user);
        if (mapped) return mapped;

        logger.error(`getFollowAge(${channel}, ${user})`, error);
        return followageError('No se pudo consultar el followage. Intenta de nuevo en unos segundos.');
    }
};

/**
 * Valida un token contra Twitch.
 * - Devuelve la respuesta si es válido.
 * - Devuelve `null` SOLO si el token es realmente inválido/expirado (HTTP 401).
 * - LANZA en errores transitorios (red/timeout/5xx) para que el llamador pueda
 *   distinguir "token inválido" de "no se pudo verificar" y no fallar en falso.
 */
export const validateToken = async (token: string): Promise<TwitchValidationResponse | null> => {
    try {
        const headers = { Authorization: `OAuth ${token}` };
        const response = await apiClient.get('https://id.twitch.tv/oauth2/validate', { headers });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

export const getFollowersCount = async (broadcasterId: string, token: string): Promise<number> => {
    try {
        const headers = getHeaders(token);
        const response = await apiClient.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: { broadcaster_id: broadcasterId }
        });
        return response.data.total || 0;
    } catch (error) {
        logger.error('Error in getFollowersCount:', error);
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getFollowersCount(${broadcasterId})`);
    }
};

export const isStreamLive = async (userId: string, token: string): Promise<boolean> => {
    const cacheKey = `cache:stream:live:${userId}`;
    try {
        const cached = await cacheService.get<boolean>(cacheKey);
        if (cached !== null && cached !== undefined) return cached;

        const headers = getHeaders(token);
        const response = await apiClient.get('https://api.twitch.tv/helix/streams', {
            headers,
            params: { user_id: userId }
        });
        const live = response.data.data.length > 0;
        await cacheService.set(cacheKey, live, 30);
        return live;
    } catch (error) {
        logger.error('Error in isStreamLive:', error);
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `isStreamLive(${userId})`);
    }
};
