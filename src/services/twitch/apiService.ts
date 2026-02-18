import axios from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import { CONFIG } from '../../config/env';
import {
    TwitchClip,
    TwitchError,
    TwitchUser,
    TwitchChannelInfo,
    TwitchValidationResponse
} from '../../types/twitch';
import { getCachedUserId, setCachedUserId } from '../infrastructure/cacheService';
import { logger } from '../../utils/logger';

const httpsAgent = new https.Agent({ keepAlive: true });
const apiClient = axios.create({
    httpsAgent,
    timeout: 10000
});

axiosRetry(apiClient, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        if (axiosRetry.isNetworkError(error)) {
            logger.warn('Network error detected, retrying...', { error: error.message });
            return true;
        }

        if (axiosRetry.isRetryableError(error)) {
            logger.warn('Retryable error detected, retrying...', {
                status: error.response?.status
            });
            return true;
        }
        if (error.response?.status === 429) {
            logger.warn('Rate limit hit, retrying with backoff...');
            return true;
        }

        return false;
    },
    onRetry: (retryCount, error, requestConfig) => {
        logger.info(`Retry attempt ${retryCount}`, {
            url: requestConfig.url,
            method: requestConfig.method,
            error: error.message
        });
    }
});

const getHeaders = (token: string) => ({
    'Client-ID': CONFIG.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${token}`
});

const handleTwitchError = (error: unknown, context: string): never => {
    logger.error(`Error in ${context}:`, error);
    if (axios.isAxiosError(error)) {
        throw {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message || 'Error en la API de Twitch',
            name: 'TwitchApiError'
        } as TwitchError;
    }
    throw {
        status: 500,
        message: 'Error interno desconocido',
        name: 'UnknownError'
    } as TwitchError;
};

export const getUserId = async (username: string, token: string): Promise<string> => {
    const cachedId = await getCachedUserId(username);
    if (cachedId) return cachedId;

    const user = await getUserInfo(username, token);
    await setCachedUserId(username, user.id);
    return user.id;
};

export const getUserInfo = async (username: string, token: string): Promise<TwitchUser> => {
    const headers = getHeaders(token);
    const response = await apiClient.get(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers
    });

    if (response.data.data.length === 0) {
        throw { status: 404, message: `El usuario/canal ${username} no existe.` } as TwitchError;
    }

    return response.data.data[0];
};

export const getChannelInfo = async (
    broadcasterId: string,
    token: string
): Promise<TwitchChannelInfo> => {
    try {
        const headers = getHeaders(token);
        const response = await apiClient.get(
            `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
            { headers }
        );

        if (response.data.data.length === 0) {
            throw { status: 404, message: `No se encontró información del canal.` } as TwitchError;
        }

        return response.data.data[0];
    } catch (error) {
        if ((error as TwitchError).status === 404) throw error;
        return handleTwitchError(error, `getChannelInfo(${broadcasterId})`);
    }
};

export const createClip = async (channel: string, token: string): Promise<string> => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);

        const url = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`;

        const clipRes = await apiClient.post(url, null, { headers });
        const clipData = clipRes.data.data[0];
        return `https://clips.twitch.tv/${clipData.id}`;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw {
                status: 404,
                message: `No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.`,
                name: 'TwitchError'
            } as TwitchError;
        }
        if (axios.isAxiosError(error)) {
            throw {
                status: error.response?.status || 500,
                message: error.message,
                name: 'TwitchError'
            } as TwitchError;
        }
        throw error;
    }
};

export const getClips = async (
    channel: string,
    limit: number,
    token: string
): Promise<TwitchClip[]> => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);

        const clipsRes = await apiClient.get(`https://api.twitch.tv/helix/clips`, {
            headers,
            params: {
                broadcaster_id: broadcasterId,
                first: limit
            }
        });

        return clipsRes.data.data as TwitchClip[];
    } catch (error) {
        return handleTwitchError(error, `getClips(${channel})`);
    }
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
        const now = new Date();
        const diff = Math.abs(now.getTime() - followDate.getTime());

        const parts = {
            años: Math.floor(diff / (1000 * 60 * 60 * 24 * 365)),
            meses: Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
            días: Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
            horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            segundos: Math.floor((diff % (1000 * 60)) / 1000)
        };

        const timeString: string[] = [];
        if (parts.años > 0) timeString.push(`${parts.años} años`);
        if (parts.meses > 0) timeString.push(`${parts.meses} meses`);
        if (parts.días > 0) timeString.push(`${parts.días} días`);
        if (parts.horas > 0) timeString.push(`${parts.horas} horas`);
        if (parts.minutos > 0) timeString.push(`${parts.minutos} minutos`);
        if (parts.segundos > 0 || timeString.length === 0)
            timeString.push(`${parts.segundos} segundos`);

        const timePhrase =
            timeString.length > 1
                ? timeString.slice(0, -1).join(', ') + ' y ' + timeString.slice(-1)
                : timeString[0];

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
        if ((error as TwitchError).status === 404) {
            return { text: (error as TwitchError).message, timePhrase: 'error' };
        }

        return handleTwitchError(error, `getFollowAge(${channel}, ${user})`);
    }
};

export const validateToken = async (token: string): Promise<TwitchValidationResponse | null> => {
    try {
        const headers = { Authorization: `OAuth ${token}` };
        const response = await apiClient.get('https://id.twitch.tv/oauth2/validate', { headers });
        return response.data;
    } catch (_error) {
        return null;
    }
};

export const getChatters = async (broadcasterId: string, moderatorId: string, token: string) => {
    try {
        const response = await apiClient.get('https://api.twitch.tv/helix/chat/chatters', {
            params: {
                broadcaster_id: broadcasterId,
                moderator_id: moderatorId,
                first: 100
            },
            headers: getHeaders(token)
        });
        return response.data.data;
    } catch (error) {
        return handleTwitchError(error, `getChatters(${broadcasterId})`);
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

export const sendChatMessage = async (
    broadcasterId: string,
    senderId: string,
    message: string,
    token: string
) => {
    try {
        await apiClient.post(
            'https://api.twitch.tv/helix/chat/messages',
            {
                broadcaster_id: broadcasterId,
                sender_id: senderId,
                message: message
            },
            {
                headers: {
                    ...getHeaders(token),
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        return handleTwitchError(error, `sendChatMessage(${broadcasterId})`);
    }
};

export const timeoutUser = async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
    duration: number,
    reason: string,
    token: string
) => {
    try {
        await apiClient.post(
            'https://api.twitch.tv/helix/moderation/bans',
            {
                data: {
                    user_id: userId,
                    duration: duration,
                    reason: reason
                }
            },
            {
                params: {
                    broadcaster_id: broadcasterId,
                    moderator_id: moderatorId
                },
                headers: {
                    ...getHeaders(token),
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        return handleTwitchError(error, `timeoutUser(${broadcasterId}, target: ${userId})`);
    }
};
