import { CONFIG } from '../config.js';
import { Loader } from '../utils/loader.js';

export const CommandsModule = {
    session: null,

    async init(session) {
        await Loader.loadCSS('css/sections/commands.css');
        this.session = session;

        this.setupFollowCommand();
        this.setupClipCommand();
    },

    setupFollowCommand() {
        const botSelect = document.getElementById('bot-select-follow');
        const output = document.getElementById('command-output-follow');

        if (botSelect && output) {
            const newSelect = botSelect.cloneNode(true);
            botSelect.parentNode.replaceChild(newSelect, botSelect);

            newSelect.addEventListener('change', () => this.updateFollowCommand());
            this.updateFollowCommand();
        }
    },

    updateFollowCommand() {
        const botSelect = document.getElementById('bot-select-follow');
        const output = document.getElementById('command-output-follow');
        if (!botSelect || !output) return;

        const { login, apiKey, token } = this.session;

        if (!login || (!apiKey && !token)) {
            console.warn('Missing credentials for followage command');
            return;
        }

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        let cmd = '';

        if (bot === 'nightbot') {
            cmd = `$(urlfetch ${domain}/api/followage?user=$(touser)&channel=${login}&${tokenParam})`;
        } else if (bot === 'streamelements' || bot === 'fossabot') {
            cmd = `$(customapi ${domain}/api/followage?user=\${user}&channel=${login}&${tokenParam})`;
        } else if (bot === 'wizebot') {
            cmd = `$(urlfetch ${domain}/api/followage?user=$(user_name)&channel=${login}&${tokenParam})`;
        }

        output.value = `!addcom !followage ${cmd}`;
    },

    setupClipCommand() {
        const botSelect = document.getElementById('bot-select-clip');
        const output = document.getElementById('command-output-clip');

        if (botSelect && output) {
            const newSelect = botSelect.cloneNode(true);
            botSelect.parentNode.replaceChild(newSelect, botSelect);

            newSelect.addEventListener('change', () => this.updateClipCommand());
            this.updateClipCommand();
        }
    },

    updateClipCommand() {
        const botSelect = document.getElementById('bot-select-clip');
        const output = document.getElementById('command-output-clip');
        if (!botSelect || !output) return;

        const { login, apiKey, token } = this.session;

        if (!login || (!apiKey && !token)) {
            console.warn('Missing credentials for clip command');
            return;
        }

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        let cmd = '';

        if (bot === 'nightbot') {
            cmd = `🎬 Clip creado por $(user): $(urlfetch ${domain}/api/create-clip?channel=${login}&${tokenParam})`;
        } else if (bot === 'wizebot') {
            cmd = `🎬 Clip creado por $(user_name): $(urlfetch ${domain}/api/create-clip?channel=${login}&${tokenParam})`;
        } else {
            cmd = `🎬 Clip creado por \${user}: $(customapi ${domain}/api/create-clip?channel=${login}&${tokenParam})`;
        }

        output.value = `!addcom !clip ${cmd}`;
    }
};
