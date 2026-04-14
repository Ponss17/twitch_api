import axios from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import { kv } from '@vercel/kv';
import { CONFIG } from '../../core/config/env';
import {
    TwitchClip,
    TwitchError,
    TwitchUser,
    TwitchChannelInfo,
    TwitchValidationResponse
} from '../../types/twitch';
import * as cacheService from '../../core/database/cacheService';
import { logger } from '../../core/utils/logger';
import { getTimePhraseBetween } from '../../core/utils/time';
import { TwitchApiError } from '../../core/errors/AppError';

const CB_KV_KEY = 'circuit_breaker:twitch';
const CB_KV_TTL_S = 120;

const httpsAgent = new https.Agent({ keepAlive: true });
const apiClient = axios.create({
    httpsAgent,
    timeout: 10000
});

export const CIRCUIT_BREAKER = {
    failures: 0,
    lastFailure: 0,
    threshold: 5,
    cooldownMs: 30000,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN'
};

type CbState = { state: 'OPEN'; lastFailure: number } | { state: 'CLOSED' };

const syncCbToKv = (state: CbState): void => {
    if (state.state === 'OPEN') {
        kv.set(CB_KV_KEY, state, { ex: CB_KV_TTL_S }).catch((e) =>
            logger.error('Cache KV error syncing CB state OPEN:', e)
        );
    } else {
        kv.del(CB_KV_KEY).catch((e) => logger.error('Cache KV error syncing CB state CLOSED:', e));
    }
};

// Al arrancar (cold start), sincronizar con KV sin bloquear
kv.get<CbState>(CB_KV_KEY)
    .then((stored) => {
        if (stored?.state === 'OPEN') {
            CIRCUIT_BREAKER.state = 'OPEN';
            CIRCUIT_BREAKER.lastFailure = stored.lastFailure;
            CIRCUIT_BREAKER.failures = CIRCUIT_BREAKER.threshold;
            logger.warn('[CircuitBreaker] Reanudado desde KV: estado OPEN');
        }
    })
    .catch((e) => logger.error('Cache KV error during CB cold start:', e));

export const checkCircuit = () => {
    if (CIRCUIT_BREAKER.state === 'OPEN') {
        const now = Date.now();
        if (now - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.cooldownMs) {
            CIRCUIT_BREAKER.state = 'HALF_OPEN';
            return;
        }
        throw new TwitchApiError(
            'Servicio de Twitch temporalmente inhabilitado (Circuit Breaker)',
            503
        );
    }
};

export const recordFailure = () => {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailure = Date.now();
    if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.threshold) {
        CIRCUIT_BREAKER.state = 'OPEN';
        logger.error('🚨 CIRCUIT BREAKER OPEN: Twitch API is failing consistently.');
        syncCbToKv({ state: 'OPEN', lastFailure: CIRCUIT_BREAKER.lastFailure });
    }
};

export const recordSuccess = () => {
    CIRCUIT_BREAKER.failures = 0;
    CIRCUIT_BREAKER.state = 'CLOSED';
    syncCbToKv({ state: 'CLOSED' });
};

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

    recordFailure();

    if (axios.isAxiosError(error)) {
        throw new TwitchApiError(
            error.response?.data?.message || error.message || 'Error en la API de Twitch',
            error.response?.status || 500
        );
    }
    throw new TwitchApiError('Error interno desconocido', 500);
};

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
    checkCircuit();
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
    return response.data.data[0];
};

export const getChannelInfo = async (
    broadcasterId: string,
    token: string
): Promise<TwitchChannelInfo> => {
    const cacheKey = `twitch:channel:${broadcasterId}`;
    try {
        // Intentar obtener de caché primero
        const cachedResult = (await cacheService.get(cacheKey)) as TwitchChannelInfo | null;
        if (cachedResult) return cachedResult;

        const headers = getHeaders(token);
        const response = await apiClient.get(
            `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
            { headers }
        );

        if (response.data.data.length === 0) {
            throw { status: 404, message: `No se encontró información del canal.` } as TwitchError;
        }

        const data = response.data.data[0];
        await cacheService.set(cacheKey, data, 1800);

        return data;
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
        if (!clipRes.data.data || clipRes.data.data.length === 0) {
            throw new TwitchApiError('La respuesta de Twitch no incluyó datos de clip', 500);
        }
        const clipData = clipRes.data.data[0];
        recordSuccess();
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

export const getChatters = async (
    broadcasterId: string,
    moderatorId: string,
    token: string
): Promise<{ user_id: string; user_login: string; user_name: string }[]> => {
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
