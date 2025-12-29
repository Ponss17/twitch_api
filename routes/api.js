const express = require('express');
const axios = require('axios');
const router = express.Router();
const tokenStore = require('../utils/tokenStore');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;

const checkToken = (req, res, next) => {
    const token = req.query.token || tokenStore.getToken();
    if (!token) {
        return res.send('Error: Token no proporcionado. Incluye ?token=TU_TOKEN en la URL.');
    }
    req.twitchToken = token;
    next();
};

router.get('/create-clip', checkToken, async (req, res) => {
    const { channel } = req.query;

    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    try {
        const headers = {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${req.twitchToken}`
        };

        const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
        if (channelRes.data.data.length === 0) return res.send(`El canal ${channel} no existe.`);
        const broadcasterId = channelRes.data.data[0].id;

        try {
            const clipRes = await axios.post(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, null, { headers });
            const clipData = clipRes.data.data[0];
            const clipUrl = `https://clips.twitch.tv/${clipData.id}`;
            return res.send(`🎬 Clip creado con éxito! ${clipUrl}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.send(`No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.`);
            }
            if (error.response) {
                return res.send(`Error Twitch [${error.response.status}]: ${error.response.data.message}`);
            }
            throw error;
        }

    } catch (error) {
        console.error('Error creando clip:', error.response?.data || error.message);
        return res.send('Error interno creando el clip.');
    }
});

router.get('/get-clips', checkToken, async (req, res) => {
    const { channel, limit } = req.query;
    const limitNum = limit || 5;

    if (!channel) return res.status(400).json({ error: 'Falta channel' });

    try {
        const headers = {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${req.twitchToken}`
        };

        const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
        if (channelRes.data.data.length === 0) return res.status(404).json({ error: 'Canal no encontrado' });
        const broadcasterId = channelRes.data.data[0].id;

        const clipsRes = await axios.get(`https://api.twitch.tv/helix/clips`, {
            headers,
            params: {
                broadcaster_id: broadcasterId,
                first: limitNum
            }
        });

        res.json(clipsRes.data.data);

    } catch (error) {
        console.error('Error fetching clips:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error obteniendo clips' });
    }
});

router.get('/followage', checkToken, async (req, res) => {
    const { channel, user } = req.query;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    try {
        const headers = {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${req.twitchToken}`
        };

        const channelRes = await axios.get(`https://api.twitch.tv/helix/users?login=${channel}`, { headers });
        if (channelRes.data.data.length === 0) return res.send(`${channel} no existe.`);
        const channelId = channelRes.data.data[0].id;

        const userRes = await axios.get(`https://api.twitch.tv/helix/users?login=${user}`, { headers });
        if (userRes.data.data.length === 0) return res.send(`${user} no existe.`);
        const userId = userRes.data.data[0].id;

        try {
            const followRes = await axios.get('https://api.twitch.tv/helix/channels/followers', {
                headers,
                params: {
                    broadcaster_id: channelId,
                    user_id: userId
                }
            });

            if (followRes.data.data.length === 0) {
                return res.send(`${user} no sigue a ${channel}.`);
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

            return res.send(`${user} ha seguido a ${channel} por ${finalString}.`);

        } catch (error) {
            console.error('Error verificando follow:', error.response?.data || error.message);
            if (error.response) {
                const status = error.response.status;
                const msg = JSON.stringify(error.response.data);
                return res.send(`Error Twitch [${status}]: ${msg}`);
            }
            return res.send(`Error Interno: ${error.message}`);
        }

    } catch (error) {
        console.error('Error General:', error.response?.data || error.message);
        res.status(500).send('Error interno del servidor.');
    }
});

module.exports = router;
