require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cookieParser());
app.use(express.static('public'));

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback';

app.get('/auth/twitch', (req, res) => {
    const scope = 'user:read:email';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

app.get('/auth/twitch/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: TWITCH_REDIRECT_URI
            }
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
            }
        });

        const user = userResponse.data.data[0];

        res.redirect(`/?token=${access_token}&userId=${user.id}&login=${user.login}&displayName=${encodeURIComponent(user.display_name)}`);

    } catch (error) {
        console.error('Error en autenticación:', error.response?.data || error.message);
        res.redirect('/?error=auth_failed');
    }
});

// API Followage
app.get('/api/followage', async (req, res) => {
    const { channel, user } = req.query;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    try {
        const appTokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        const appAccessToken = appTokenResponse.data.access_token;
        const headers = {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${appAccessToken}`
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
            const diffTime = Math.abs(now - followDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let timeString = '';
            const years = Math.floor(diffDays / 365);
            const months = Math.floor((diffDays % 365) / 30);
            const days = (diffDays % 365) % 30;

            if (years > 0) timeString += `${years} años, `;
            if (months > 0) timeString += `${months} meses, `;
            timeString += `${days} días`;

            return res.send(`${user} ha seguido a ${channel} por ${timeString}.`);

        } catch (error) {
            console.error('Error verificando follow:', error.response?.data || error.message);
            return res.send('Error verificando el seguimiento.');
        }

    } catch (error) {
        console.error('Error General:', error.response?.data || error.message);
        res.status(500).send('Error interno del servidor.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
