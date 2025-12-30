const axios = require('axios');
const config = require('../config/env');

const createClip = async (channel, token) => {
    const headers = {
        'Client-ID': config.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    if (channelRes.data.data.length === 0) throw { status: 404, message: `El canal ${channel} no existe.` };
    const broadcasterId = channelRes.data.data[0].id;

    try {
        const clipRes = await axios.post(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, null, { headers });
        const clipData = clipRes.data.data[0];
        return `https://clips.twitch.tv/${clipData.id}`;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw { status: 404, message: `No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.` };
        }
        throw error;
    }
};

const getClips = async (channel, limit, token) => {
    const headers = {
        'Client-ID': config.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
    if (channelRes.data.data.length === 0) throw { status: 404, message: 'Canal no encontrado' };
    const broadcasterId = channelRes.data.data[0].id;

    const clipsRes = await axios.get(`https://api.twitch.tv/helix/clips`, {
        headers,
        params: {
            broadcaster_id: broadcasterId,
            first: limit
        }
    });

    return clipsRes.data.data;
};

const getFollowAge = async (channel, user, token) => {
    const headers = {
        'Client-ID': config.TWITCH_CLIENT_ID,
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
    let diff = Math.abs(now - followDate);

    const parts = {
        años: Math.floor(diff / (1000 * 60 * 60 * 24 * 365)),
        meses: Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
        días: Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diff % (1000 * 60)) / 1000)
    };

    let timeString = [];
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

module.exports = {
    createClip,
    getClips,
    getFollowAge
};
