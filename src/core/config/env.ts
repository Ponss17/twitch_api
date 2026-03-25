import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error(
        '❌ Faltan variables de entorno críticas: TWITCH_CLIENT_ID y/o TWITCH_CLIENT_SECRET.'
    );
}

if (!ENCRYPTION_KEY) {
    throw new Error(
        "❌ Falta la variable de entorno ENCRYPTION_KEY. Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
}

export const CONFIG = {
    PORT: process.env.PORT || 3000,
    TWITCH_CLIENT_ID: TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: TWITCH_CLIENT_SECRET,
    ENCRYPTION_KEY: ENCRYPTION_KEY,
    TWITCH_REDIRECT_URI:
        process.env.TWITCH_REDIRECT_URI ||
        'https://www.losperris.dev/api/twitch/auth/twitch/callback',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MAX_MESSAGE_TOKENS: 100,
    DISCORD_FEEDBACK_WEBHOOK_URL: process.env.DISCORD_FEEDBACK_WEBHOOK_URL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    BASE_URL: process.env.BASE_URL || 'https://www.losperris.dev/api/twitch',
    ADMIN_ROOT_ID: process.env.ADMIN_ROOT_ID, // Tu ID de Twitch para acceso root
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, // Contraseña para el panel admin local
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
};
