import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error('❌ Faltan variables de entorno críticas: TWITCH_CLIENT_ID y/o TWITCH_CLIENT_SECRET.');
}

export const CONFIG = {
    PORT: process.env.PORT || 3000,
    TWITCH_CLIENT_ID: TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: TWITCH_CLIENT_SECRET,
    TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI || 'https://losperris.site/api/twitch/auth/twitch/callback',
    NODE_ENV: process.env.NODE_ENV || 'development',
    GROQ_API_KEY: process.env.GROQ_API_KEY
};
