const protocol = window.location.protocol;
const host = window.location.host;
export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    API_URL: '/api/twitch',
    twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`,
};
Object.freeze(CONFIG);
