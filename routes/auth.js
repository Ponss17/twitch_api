const express = require('express');
const axios = require('axios');
const router = express.Router();
const tokenStore = require('../utils/tokenStore');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/twitch/callback';

router.get('/twitch', (req, res) => {
    const scope = 'user:read:email moderator:read:followers clips:edit';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

router.get('/twitch/callback', async (req, res) => {
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

        tokenStore.setToken(access_token);

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

module.exports = router;
