const API_BASE = '/api/twitch';
export const DASHBOARD_CONFIG = {
    API_ENDPOINTS: {
        BASE: API_BASE,
        MAGIC8: `${API_BASE}/minigames/magic8`,
        ANALYTICS: `${API_BASE}/dashboard/analytics`,
        REGENERATE_KEY: `${API_BASE}/system/regenerate-key`,
        FEEDBACK: `${API_BASE}/system/feedback`,
        CHATTERS: `${API_BASE}/dashboard/chatters`,
        USER_INFO: `${API_BASE}/dashboard/user-info`,
        SEND_MESSAGE: `${API_BASE}/send-message`,
        CLIPS: `${API_BASE}/dashboard/get-clips`,
        DUEL: `${API_BASE}/minigames/duel`
    },
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
    ]),
    DOM_IDS: {
        MAGIC8: {
            INPUT: 'magic8-question',
            BUTTON: 'btn-ask-magic8',
            RESPONSE: 'magic8-response',
            COMMAND_OUTPUT: 'magic8-command-output',
            BOT_SELECT: 'magic8-bot-select',
            MOOD_SELECT: 'magic8-mood-select'
        },
        DUEL: {
            INPUT_TARGET: 'duel-target',
            INPUT_CHALLENGER: 'duel-challenger',
            BUTTON: 'btn-fight-duel',
            RESPONSE: 'duel-response'
        }
    }
};
