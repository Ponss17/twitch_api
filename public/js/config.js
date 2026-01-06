const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const protocol = window.location.protocol;
const host = window.location.host;

export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    twitchRedirectUri: `${protocol}//${host}/api/twitch/auth/twitch/callback`
};

Object.freeze(CONFIG);
