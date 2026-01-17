import { CONFIG } from '../config.js';
import { Loader } from '../utils/loader.js';
import { Messages } from '../utils/messages.js';
import { Auth } from '../auth.js';

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
                let cmd = '';

                if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;

                if (bot === 'nightbot') {
                    cmd = `$(urlfetch ${domain}/followage?${queryParams}&user=$(touser))`;
                } else if (bot === 'streamelements' || bot === 'fossabot') {
                    cmd = `$(customapi ${domain}/followage?${queryParams}&user=\${user})`;
                } else if (bot === 'wizebot') {
                    cmd = `$(urlfetch ${domain}/followage?${queryParams}&user=$(user_name))`;
                }
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
                let apiCall = '';
                let userVar = '';

                if (bot === 'nightbot') {
                    apiCall = `$(urlfetch ${domain}/create-clip?channel=${login}&${tokenParam})`;
                    userVar = '$(user)';
                } else if (bot === 'wizebot') {
                    apiCall = `$(urlfetch ${domain}/create-clip?channel=${login}&${tokenParam})`;
                    userVar = '$(user_name)';
                } else {
                    apiCall = `$(customapi ${domain}/create-clip?channel=${login}&${tokenParam})`;
                    userVar = '\${user}';
                }

                let cmd = '';
                if (templateVal) {
                    cmd = templateVal.replace('{user}', userVar).replace('{url}', apiCall);
                } else {
                    cmd = `🎬 Clip creado por ${userVar}: ${apiCall}`;
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
                let cmd = '';

                if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;

                if (bot === 'nightbot') {
                    cmd = `$(urlfetch ${domain}/shoutout?${queryParams}&touser=$(touser))`;
                } else if (bot === 'wizebot') {
                    cmd = `$(urlfetch ${domain}/shoutout?${queryParams}&touser=$(arg_1))`;
                } else {
                    cmd = `$(customapi ${domain}/shoutout?${queryParams}&touser=\${1})`;
                }
                return `!addcom !so ${cmd}`;
            }
        }
    },

    async init() {
        if (this.initialized) return;
        this.initialized = true;

        await Loader.loadCSS('css/sections/commands.css');
        this.session = Auth.getSession();
        if (!this.session) return;

        this.renderCommandCards();
        this.setupGenericCommands();
        this.setupTestCommand();

        const refreshBtn = document.getElementById('refresh-clips-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRecentClips());
        }

        this.loadRecentClips();
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
                <div class="card-icon">
                    <i class="${conf.icon}"></i>
                </div>
                <div>
                    <h3>${conf.title}</h3>
                    <p class="card-desc">${conf.desc}</p>
                </div>
                <div class="header-actions" style="margin-left: auto; display: flex; align-items: center; gap: 10px;">
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
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9em; color: var(--text-secondary);">
                        <i class="fa-solid fa-pen-to-square"></i> Mensaje Personalizado (Opcional)
                    </label>
                    <input type="text" id="${conf.id}-template" class="text-input" 
                        placeholder="${conf.templatePlaceholder}"
                        style="width: 100%;">
                    <small style="display: block; margin-top: 5px; color: var(--text-tertiary); font-size: 0.8em;">
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
        const domain = `${CONFIG.siteUrl}/api/twitch`;
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

            resultBox.classList.remove('hidden');
            resultText.innerHTML = Messages.Commands.testing;

            const { apiKey, token } = this.session;
            const domain = `${CONFIG.siteUrl}/api/twitch`;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;

            try {
                const response = await fetch(url);
                const text = await response.text();

                if (response.ok) {
                    resultText.innerHTML = Messages.Commands.success(text);
                } else {
                    resultText.innerHTML = Messages.Commands.error(text);
                }
            } catch (err) {
                resultText.innerHTML = Messages.Commands.connectionError;
                console.error(err);
            }
        });
    },

    async loadRecentClips() {
        const gallery = document.getElementById('clips-gallery');
        if (!gallery) return;

        gallery.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clips...</div>';

        const { token, login } = this.session;

        try {
            const domain = `${CONFIG.siteUrl}/api/twitch`;
            const response = await fetch(`${domain}/get-clips?token=${token}&channel=${login}`);

            if (!response.ok) {
                console.error('API Error:', await response.text());
                gallery.innerHTML = '<div class="error-state">Error al cargar clips (API).</div>';
                return;
            }

            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                gallery.innerHTML = '<div class="empty-state">No se encontraron clips recientes.</div>';
                return;
            }

            gallery.innerHTML = data.data.map(clip => `
                <div class="clip-card">
                    <a href="${clip.url}" target="_blank" class="clip-thumb">
                        <img src="${clip.thumbnail_url}" alt="${clip.title}">
                        <div class="clip-duration">${clip.duration}s</div>
                    </a>
                    <div class="clip-info">
                        <div class="clip-title" title="${clip.title}">${clip.title}</div>
                        <div class="clip-meta">
                            <span class="clip-views"><i class="fa-solid fa-eye"></i> ${clip.view_count}</span>
                            <span class="clip-date">${new Date(clip.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading clips:', error);
            gallery.innerHTML = '<div class="error-state">Error cargando clips.</div>';
        }
    }
};
