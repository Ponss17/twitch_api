import axios from 'axios';
import { CONFIG } from '../config/env';
import { TwitchClip, TwitchError } from '../types/twitch';
import { getCachedUserId, setCachedUserId } from './cacheService';

const getHeaders = (token: string) => ({
    'Client-ID': CONFIG.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${token}`
});

const getUserId = async (username: string, token: string): Promise<string> => {
    const cachedId = await getCachedUserId(username);
    if (cachedId) return cachedId;

    const user = await getUserInfo(username, token);
    await setCachedUserId(username, user.id);
    return user.id;
};

export const getUserInfo = async (username: string, token: string): Promise<any> => {
    const headers = getHeaders(token);
    const response = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, { headers });

    if (response.data.data.length === 0) {
        throw { status: 404, message: `El usuario/canal ${username} no existe.` } as TwitchError;
    }

    return response.data.data[0];
};

export const createClip = async (channel: string, token: string): Promise<string> => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);

        const clipRes = await axios.post(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, null, { headers });
        const clipData = clipRes.data.data[0];
        return `https://clips.twitch.tv/${clipData.id}`;
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw { status: 404, message: `No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.` } as TwitchError;
        }
        throw error;
    }
};

export const getClips = async (channel: string, limit: number, token: string): Promise<TwitchClip[]> => {
    const broadcasterId = await getUserId(channel, token);
    const headers = getHeaders(token);

    const clipsRes = await axios.get(`https://api.twitch.tv/helix/clips`, {
        headers,
        params: {
            broadcaster_id: broadcasterId,
            first: limit
        }
    });

    return clipsRes.data.data as TwitchClip[];
};

export const getFollowAge = async (channel: string, user: string, token: string): Promise<string> => {
    try {
        const [channelId, userId] = await Promise.all([
            getUserId(channel, token),
            getUserId(user, token)
        ]);

        const headers = getHeaders(token);
        const followRes = await axios.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: {
                broadcaster_id: channelId,
                user_id: userId
            }
        });

        if (followRes.data.data.length === 0) {
            return `${user} no sigue a ${channel}.`;
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

        let timeString: string[] = [];
        if (parts.años > 0) timeString.push(`${parts.años} años`);
        if (parts.meses > 0) timeString.push(`${parts.meses} meses`);
        if (parts.días > 0) timeString.push(`${parts.días} días`);
        if (parts.horas > 0) timeString.push(`${parts.horas} horas`);
        if (parts.minutos > 0) timeString.push(`${parts.minutos} minutos`);
        if (parts.segundos > 0 || timeString.length === 0) timeString.push(`${parts.segundos} segundos`);

        const finalString = timeString.length > 1
            ? timeString.slice(0, -1).join(', ') + ' y ' + timeString.slice(-1)
            : timeString[0];

        return `${user} ha seguido a ${channel} por ${finalString}.`;

    } catch (error: unknown) {
        const err = error as TwitchError;
        if (err.status === 404) return err.message || 'Usuario no encontrado';
        throw error;
    }
};

export const validateToken = async (token: string): Promise<any> => {
    try {
        const headers = { 'Authorization': `OAuth ${token}` };
        const response = await axios.get('https://id.twitch.tv/oauth2/validate', { headers });
        return response.data;
    } catch (error) {
        return null;
    }
};

export const getChatters = async (broadcasterId: string, moderatorId: string, token: string) => {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/chat/chatters', {
            params: {
                broadcaster_id: broadcasterId,
                moderator_id: moderatorId,
                first: 100
            },
            headers: {
                'Client-ID': CONFIG.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching chatters:', error);
        throw error;
    }
};
