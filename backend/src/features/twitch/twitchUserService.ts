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
        return handleTwitchError(error, `getUserId(${username})`);
    }
};

export const getUserInfo = async (username: string, token: string): Promise<TwitchUser> => {
    const cached = userInfoCache.get(username.toLowerCase());
    if (cached && cached.expiry > Date.now()) return cached.data;

    await checkCircuit();
    const headers = getHeaders(token);
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
};

export const getFollowAge = async (
    channel: string,
    user: string,
    token: string
): Promise<{ text: string; timePhrase: string }> => {
    try {
        const [channelId, userId] = await Promise.all([
            getUserId(channel, token),
            getUserId(user, token)
        ]);

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
            timePhrase
        };
    } catch (error: unknown) {
        // Special handling for 404 in followage to return a friendly message
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            const msg = error.response.data?.message || 'Usuario no encontrado';
            return { text: msg, timePhrase: 'error' };
        }
        if (error instanceof TwitchApiError && error.statusCode === 404) {
            return { text: error.message, timePhrase: 'error' };
        }

        return handleTwitchError(error, `getFollowAge(${channel}, ${user})`);
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
        return 0;
    }
};
