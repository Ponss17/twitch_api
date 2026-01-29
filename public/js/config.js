const protocol = window.location.protocol;
const host = window.location.host;
export const CONFIG = {
    domain: host,
    siteUrl: `${protocol}//${host}`,
    API_URL: '/api/twitch',
    twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`,
    IGNORED_BOTS: new Set([
        'nightbot',
        'streamelements',
        'fossabot',
        'moobot',
        'wizebot',
        'soundalert',
        'rainmaker',
        'botrixoficial',
        'trackerggbot',
        'streamlabs',
        'cloudbot',
        'deepbot',
        'phantombot',
        'streamerbot',
        'stayhydratedbot',
        'commanderroot',
        'own3d',
        'streamholics',
        'anotherttvviewer',
        'electricallongboard'
    ])
};
Object.freeze(CONFIG);
