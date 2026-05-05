const protocol = window.location.protocol;
const host = window.location.host;
const API_BASE = '/api/twitch';

// Supabase configuration - debe coincidir con el backend (.env)
const SUPABASE_URL = 'https://tkwkgxetfcxojbsnecqy.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2tneGV0ZmN4b2pic25lY3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjUwNDgsImV4cCI6MjA5MDA0MTA0OH0.Zm7oPasbHE3k-kZMDSMIBii7ZG77xHBTGjkq_WdgK1A';

export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    API_URL: API_BASE,
    twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`,
    SUPABASE_URL,
    SUPABASE_ANON_KEY
};

Object.freeze(CONFIG);
