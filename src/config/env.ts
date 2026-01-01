import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

export const CONFIG = {
    PORT: process.env.PORT || 3000,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI || 'https://losperris.site/api/twitch/auth/twitch/callback',
    NODE_ENV: process.env.NODE_ENV || 'development'
};
