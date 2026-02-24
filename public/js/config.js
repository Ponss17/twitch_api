// frontend/config.ts
var protocol = window.location.protocol;
var host = window.location.host;
var API_BASE = "/api/twitch";
var CONFIG = {
  domain: host,
  siteUrl: `${protocol}//${host}`,
  API_URL: API_BASE,
  twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`
};
Object.freeze(CONFIG);
export {
  CONFIG
};
