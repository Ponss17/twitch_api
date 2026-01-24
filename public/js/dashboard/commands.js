import { CONFIG } from '../config.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { Loader } from '../utils/loader.js';
import { Messages } from '../utils/messages.js';
import { Auth } from '../auth.js';
import { CommandGenerator } from '../utils/commandGenerator.js';

export const CommandsModule = {
    session: null,

    COMMAND_CONFIG: {
        follow: {
            id: 'follow',
            containerId: 'command-card-followage',
            title: 'Comando !followage',
            icon: 'fa-solid fa-wrench',
            desc: 'Muestra cuánto tiempo lleva alguien siguiéndote',
            info: 'Genera el código para que tu bot responda con el tiempo exacto que un usuario te sigue.',
            templatePlaceholder: 'Ej: {user} lleva sufriendo {time}.',
            templateVars: 'Variables: {user}, {time}, {channel}',
            generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
                const generator = CommandGenerator;
                const botUtils = generator.bots[bot] || generator.bots.nightbot;
                const userArg = bot === 'wizebot' ? '$(user_name)' : botUtils.arg('user');

                if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
                queryParams += `&user=${userArg}`;

                const cmd = generator.generate(bot, `${domain}/followage`, queryParams);
                return `!addcom !followage ${cmd}`;
            }
        },
        clip: {
            id: 'clip',
            containerId: 'command-card-clip',
            title: 'Comando !clip',
            icon: 'fa-solid fa-video',
            desc: 'Permite crear clips desde el chat',
            info: 'Tus moderadores podrán crear clips instantáneos escribiendo !clip. Requiere estar en vivo.',
            templatePlaceholder: 'Ej: ¡Mirad este clip de {user}! 👉 {url}',
            templateVars: 'Variables: {user}, {url}',
            generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
                const generator = CommandGenerator;
                const botUtils = generator.bots[bot] || generator.bots.nightbot;

                const userArg = bot === 'nightbot' ? '$(user)' : (bot === 'wizebot' ? '$(user_name)' : '${user}');
                const apiCall = generator.generate(bot, `${domain}/create-clip`, queryParams);

                let cmd = '';
                if (templateVal) {
                    cmd = templateVal.replace('{user}', userArg).replace('{url}', apiCall);
                } else {
                    cmd = `🎬 Clip creado por ${userArg}: ${apiCall}`;
                }
                return `!addcom !clip ${cmd}`;
            }
        },
        shoutout: {
            id: 'shoutout',
            containerId: 'command-card-shoutout',
            title: 'Comando !so',
            icon: 'fa-solid fa-bullhorn',
            desc: 'Promociona a otro streamer',
            info: 'Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.',
            templatePlaceholder: 'Ej: Echadle un follow a {user}, cracks jugando {game} 👉 {url}',
            templateVars: 'Variables disponibles: {user}, {game}, {url}',
            generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
                const generator = CommandGenerator;
                const botUtils = generator.bots[bot] || generator.bots.nightbot;

                let targetArg = '';
                if (bot === 'wizebot') targetArg = '$(arg_1)';
                else if (bot === 'nightbot') targetArg = '$(touser)';
                else targetArg = '${1}';

                if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
                queryParams += `&touser=${targetArg}`;

                const cmd = generator.generate(bot, `${domain}/shoutout`, queryParams);
                return `!addcom !so ${cmd}`;
            }
        }
    },

    async init(session) {
        this.session = session;
        if (!this.session) return;

        this.renderCommandCards();
        this.setupGenericCommands();
        this.setupTestCommand();

        if (!this.initialized) {
            this.initialized = true;
        }
    },

    renderCommandCards() {
        Object.values(this.COMMAND_CONFIG).forEach(conf => {
            const container = document.getElementById(conf.containerId);
            if (!container) return;

            container.innerHTML = this.generateCardHTML(conf);
        });
    },

    generateCardHTML(conf) {
        return `
        <div class="card">
            <div class="card-header">
                <div class="card-title-group">
                    <div class="card-icon">
                        <i class="${conf.icon}"></i>
                    </div>
                    <div>
                        <h3>${conf.title}</h3>
                        <p class="card-desc">${conf.desc}</p>
                    </div>
                </div>
                <div class="header-actions header-actions-flex">
                    <i class="fa-solid fa-circle-question info-icon" data-tooltip="${conf.info}"></i>
                </div>
            </div>
            <div class="card-body">
                <div class="tool-selector">
                    <label><i class="fa-solid fa-robot"></i> Selecciona tu bot:</label>
                    <select id="bot-select-${conf.id}" class="select-input">
                        <option value="nightbot">Nightbot</option>
                        <option value="streamelements">StreamElements</option>
                        <option value="fossabot">Fossabot</option>
                        <option value="wizebot">Wizebot</option>
                    </select>
                </div>
                
                <div class="form-group mb-20">
                    <label class="input-label">
                        <i class="fa-solid fa-pen-to-square"></i> Mensaje Personalizado (Opcional)
                    </label>
                    <input type="text" id="${conf.id}-template" class="text-input full-width" 
                        placeholder="${conf.templatePlaceholder}">
                    <small class="input-help">
                        ${conf.templateVars}
                    </small>
                </div>

                <div class="code-box">
                    <textarea id="command-output-${conf.id}" readonly></textarea>
                    <button class="btn-copy copy-btn" data-target="command-output-${conf.id}">
                        <i class="fa-regular fa-copy"></i> Copiar
                    </button>
                </div>
            </div>
        </div>`;
    },

    setupGenericCommands() {
        Object.values(this.COMMAND_CONFIG).forEach(conf => {
            const botSelect = document.getElementById(`bot-select-${conf.id}`);
            const output = document.getElementById(`command-output-${conf.id}`);
            const templateInput = document.getElementById(`${conf.id}-template`);

            if (botSelect && output && templateInput) {
                const updateFn = () => this.updateCommand(conf);

                const newSelect = botSelect.cloneNode(true);
                const newInput = templateInput.cloneNode(true);
                botSelect.parentNode.replaceChild(newSelect, botSelect);
                templateInput.parentNode.replaceChild(newInput, templateInput);

                newSelect.addEventListener('change', updateFn);
                newInput.addEventListener('input', updateFn);

                updateFn();
            }
        });
    },

    updateCommand(conf) {
        const botSelect = document.getElementById(`bot-select-${conf.id}`);
        const output = document.getElementById(`command-output-${conf.id}`);
        const templateInput = document.getElementById(`${conf.id}-template`);

        if (!botSelect || !output) return;

        const { login, apiKey, token } = this.session;

        if (!login || (!apiKey && !token)) {
            console.warn(Messages.Commands.missingCreds);
            return;
        }

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        const templateVal = templateInput.value.trim();
        const queryParams = `channel=${login}&${tokenParam}`;

        const realCmd = conf.generate(domain, login, tokenParam, bot, templateVal, queryParams);
        const maskedCmd = realCmd.replace(apiKey, '**************');

        output.value = maskedCmd;
        output.dataset.realValue = realCmd;
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
                alert(Messages.Commands.completeFields);
                return;
            }

            resultBox.classList.add('active');

            resultBox.classList.remove('success', 'error');

            resultText.innerHTML = Messages.Commands.testing;

            const { apiKey, token } = this.session;
            const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;

            try {
                const response = await fetch(url);
                const text = await response.text();

                if (response.ok) {
                    resultBox.classList.add('success');
                    resultText.innerHTML = `<i class="fa-solid fa-check"></i> ${text}`;
                } else {
                    resultBox.classList.add('error');
                    resultText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`;
                }
            } catch (err) {
                resultText.innerHTML = Messages.Commands.connectionError;
                console.error(err);
            }
        });
    },


};
