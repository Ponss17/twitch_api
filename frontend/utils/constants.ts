import { CONFIG } from '../config.js';

export const API_ENDPOINTS = {
    BASE: CONFIG.API_URL,
    MAGIC8: `${CONFIG.API_URL}/minigames/magic8`,
    ANALYTICS: `${CONFIG.API_URL}/dashboard/analytics`,
    REGENERATE_KEY: `${CONFIG.API_URL}/system/regenerate-key`,
    FEEDBACK: `${CONFIG.API_URL}/system/feedback`,
    CHATTERS: `${CONFIG.API_URL}/dashboard/chatters`,
    USER_INFO: `${CONFIG.API_URL}/dashboard/user-info`,
    SEND_MESSAGE: `${CONFIG.API_URL}/send-message`,
    CLIPS: `${CONFIG.API_URL}/dashboard/get-clips`
};

export const DOM_IDS = {
    MAGIC8: {
        INPUT: 'magic8-question',
        BUTTON: 'btn-ask-magic8',
        RESPONSE: 'magic8-response',
        COMMAND_OUTPUT: 'magic8-command-output',
        BOT_SELECT: 'magic8-bot-select',
        MOOD_SELECT: 'magic8-mood-select'
    }
};
