import axios from 'axios';
import { CONFIG } from '../config/env';
import { TwitchClip, TwitchError } from '../types/twitch';

export const createClip = async (channel: string, token: string): Promise<string> => {
    const headers = {
        'Client-ID': CONFIG.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    if (channelRes.data.data.length === 0) {
        throw { status: 404, message: `El canal ${channel} no existe.` } as TwitchError;
    }
    const broadcasterId = channelRes.data.data[0].id;

    try {
        const clipRes = await axios.post(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, null, { headers });
        const clipData = clipRes.data.data[0];
        return `https://clips.twitch.tv/${clipData.id}`;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            throw { status: 404, message: `No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.` } as TwitchError;
        }
        throw error;
    }
};

export const getClips = async (channel: string, limit: number, token: string): Promise<TwitchClip[]> => {
    const headers = {
        'Client-ID': CONFIG.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    if (channelRes.data.data.length === 0) {
        throw { status: 404, message: 'Canal no encontrado' } as TwitchError;
    }
    const broadcasterId = channelRes.data.data[0].id;

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
    const headers = {
        'Client-ID': CONFIG.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    if (channelRes.data.data.length === 0) return `${channel} no existe.`;
    const channelId = channelRes.data.data[0].id;

    const userRes = await axios.get(`https://api.twitch.tv/helix/users?login=${user}`, { headers });
    if (userRes.data.data.length === 0) return `${user} no existe.`;
    const userId = userRes.data.data[0].id;

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
};
