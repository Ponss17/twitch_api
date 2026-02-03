const protocol = window.location.protocol;
const host = window.location.host;
const API_BASE = '/api/twitch';
export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    API_URL: API_BASE,
    twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`
};
Object.freeze(CONFIG);
