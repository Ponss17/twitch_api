import { CONFIG } from '../config.js';
import { Loader } from '../utils/loader.js';
import { Messages } from '../utils/messages.js';

export const CommandsModule = {
    session: null,

    async init(session) {
        await Loader.loadCSS('css/sections/commands.css');
        this.session = session;

        this.setupFollowCommand();
        this.setupClipCommand();
        this.setupTestCommand();
    },

    setupTestCommand() {
        const btn = document.getElementById('run-test-btn');
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const channel = document.getElementById('test-channel').value.trim();
            const user = document.getElementById('test-user').value.trim();
            const resultBox = document.getElementById('test-result-container');
            const resultText = document.getElementById('test-result-text');

            if (!channel || !user) {
                alert('Por favor, completa ambos campos.');
                return;
            }

            resultBox.classList.remove('hidden');
            resultText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando...';

            const { apiKey, token } = this.session;
            const domain = `${CONFIG.siteUrl}/api/twitch`;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;

            try {
                const response = await fetch(url);
                const text = await response.text();

                if (response.ok) {
                    resultText.innerHTML = `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`;
                } else {
                    resultText.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`;
                }
            } catch (err) {
                resultText.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión</span>`;
                console.error(err);
            }
        });
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
            console.warn(Messages.Commands.missingCreds);
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

        const realCmd = `!addcom !followage ${cmd}`;
        const maskedCmd = realCmd.replace(apiKey, '**************');

        output.value = maskedCmd;
        output.dataset.realValue = realCmd;
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
            console.warn(Messages.Commands.missingCreds);
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

        const realCmd = `!addcom !clip ${cmd}`;
        const maskedCmd = realCmd.replace(apiKey, '**************');

        output.value = maskedCmd;
        output.dataset.realValue = realCmd;
    }
};
