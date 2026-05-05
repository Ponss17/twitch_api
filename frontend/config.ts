const protocol = window.location.protocol;
const host = window.location.host;
const API_BASE = '/api/twitch';

// Supabase configuration - URL pública del proyecto
const SUPABASE_URL = 'https://hzqxfzsbkskcdtrcximx.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cXhmenNia3NrY2R0cmN4aW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MTg0NDIsImV4cCI6MjAyMjM5NDQ0Mn0.nHfHQD_bD0bLK8e8I2OjZ0QvzKhykH3Fvz5Q0-2vQ1U';

export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    API_URL: API_BASE,
    twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`,
    SUPABASE_URL,
    SUPABASE_ANON_KEY
};

Object.freeze(CONFIG);
