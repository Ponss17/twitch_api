import { CONFIG } from '../../config.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { Messages } from '../../utils/messages.js';
import { CommandGenerator } from '../../utils/commandGenerator.js';
import { COMMAND_CONFIG } from './config.js';
import { CommandTemplates } from './templates.js';

window.CommandUtils = { CommandGenerator };

export const CommandsModule = {
    session: null,

    async init(session) {
        this.session = session;
        if (!this.session) return;

        this.renderCommandCards();
        this.setupGenericCommands();
        this.setupTestCommand();
    },

    renderCommandCards() {
        Object.values(COMMAND_CONFIG).forEach(conf => {
            const container = document.getElementById(conf.containerId);
            if (!container) return;
            container.innerHTML = CommandTemplates.generateCard(conf);
        });
    },

    setupGenericCommands() {
        Object.values(COMMAND_CONFIG).forEach(conf => {
            const botSelect = document.getElementById(`bot-select-${conf.id}`);
            const output = document.getElementById(`command-output-${conf.id}`);
            const templateInput = document.getElementById(`${conf.id}-template`);

            if (botSelect && output) {
                const updateFn = () => this.updateCommand(conf);

                botSelect.addEventListener('change', updateFn);
                if (templateInput) templateInput.addEventListener('input', updateFn);

                if (conf.extraSelectors) {
                    conf.extraSelectors.forEach(sel => {
                        const selEl = document.getElementById(`extra-${conf.id}-${sel.id}`);
                        if (selEl) selEl.addEventListener('change', updateFn);
                    });
                }

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
        const currentApiKey = apiKey || '';

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        const templateVal = templateInput ? templateInput.value.trim() : '';
        const queryParams = `channel=${login}&${tokenParam}`;

        const extraValues = {};
        if (conf.extraSelectors) {
            conf.extraSelectors.forEach(sel => {
                const selEl = document.getElementById(`extra-${conf.id}-${sel.id}`);
                if (selEl) extraValues[sel.id] = selEl.value;
            });
        }

        const realCmd = conf.generate(domain, login, tokenParam, bot, templateVal, queryParams, extraValues);
        const maskedCmd = realCmd.split(currentApiKey).join('**************');

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
    }
};
