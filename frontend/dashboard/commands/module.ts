import { CONFIG } from '../../config.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { CommandsMessages } from './messages.js';
import { CommandGenerator } from '../../utils/commandGenerator.js';
import { COMMAND_CONFIG } from './config.js';
import { CommandTemplates } from './templates.js';
import { UI } from '../../ui.js';
import { Session } from '../../types.js';
import { CommandConfigItem } from './types.js';

declare global {
    interface Window {
        CommandUtils: { CommandGenerator: typeof CommandGenerator };
    }
}

window.CommandUtils = { CommandGenerator };

export const CommandsModule = {
    session: null as Session | null,
    initialized: false,

    async init(session: Session) {
        this.session = session;
        if (!this.session) return;

        this.renderCommandCards();
        this.setupGenericCommands();
        this.setupTestCommand();
        this.initialized = true;
    },

    deactivate() {},

    renderCommandCards() {
        Object.values(COMMAND_CONFIG).forEach((conf) => {
            const config = conf as CommandConfigItem;
            const container = document.getElementById(config.containerId);
            if (!container) return;

            // Only render if empty or contains nothing relevant to avoid duplication
            // but for commands, we want to ensure fresh IDs are bound, so we overwrite.
            container.innerHTML = CommandTemplates.generateCard(config);
        });
    },

    setupGenericCommands() {
        Object.values(COMMAND_CONFIG).forEach((conf) => {
            const config = conf as CommandConfigItem;
            const botSelect = document.getElementById(`bot-select-${config.id}`);
            const output = document.getElementById(`command-output-${config.id}`);
            const templateInput = document.getElementById(`${config.id}-template`);

            if (botSelect && output) {
                const updateFn = () => this.updateCommand(config);

                botSelect.addEventListener('change', updateFn);
                if (templateInput) templateInput.addEventListener('input', updateFn);

                if (config.extraSelectors) {
                    config.extraSelectors.forEach((sel) => {
                        const selEl = document.getElementById(`extra-${config.id}-${sel.id}`);
                        if (selEl) selEl.addEventListener('change', updateFn);
                    });
                }

                updateFn();
            }
        });
    },

    updateCommand(conf: CommandConfigItem) {
        const botSelect = document.getElementById(`bot-select-${conf.id}`) as HTMLSelectElement;
        const output = document.getElementById(`command-output-${conf.id}`) as HTMLInputElement;
        const templateInput = document.getElementById(`${conf.id}-template`) as HTMLInputElement;

        if (!botSelect || !output) return;
        if (!this.session) return;

        const { login, apiKey, token } = this.session;
        const currentApiKey = apiKey || '';

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        const templateVal = templateInput ? templateInput.value.trim() : '';
        const queryParams = `channel=${login}&${tokenParam}`;

        const extraValues: Record<string, string> = {};
        if (conf.extraSelectors) {
            conf.extraSelectors.forEach((sel) => {
                const selEl = document.getElementById(
                    `extra-${conf.id}-${sel.id}`
                ) as HTMLInputElement;
                if (selEl) extraValues[sel.id] = selEl.value;
            });
        }

        const realCmd = conf.generate(
            domain,
            login,
            tokenParam,
            bot,
            templateVal,
            queryParams,
            extraValues
        );
        const maskedCmd = realCmd.split(currentApiKey).join('**************');

        output.value = maskedCmd;
        output.dataset.realValue = realCmd;
    },

    setupTestCommand() {
        const btn = document.getElementById('run-test-btn');
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.parentNode!.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const channel = (
                document.getElementById('test-channel') as HTMLInputElement
            ).value.trim();
            const user = (document.getElementById('test-user') as HTMLInputElement).value.trim();
            const resultBox = document.getElementById('test-result-container')!;
            const resultText = document.getElementById('test-result-text')!;

            if (!channel || !user) {
                alert(CommandsMessages.completeFields);
                return;
            }

            resultBox.classList.add('active');
            resultBox.classList.remove('success', 'error');
            resultText.innerHTML = CommandsMessages.testing;

            if (!this.session) return;
            const { apiKey, token } = this.session;
            const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;

            try {
                const response = await fetch(url);
                const text = await response.text();

                const safeText = UI.escapeHTML(text);
                if (response.ok) {
                    resultBox.classList.add('success');
                    resultText.innerHTML = `<i class="fa-solid fa-check"></i> ${safeText}`;
                } else {
                    resultBox.classList.add('error');
                    resultText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${safeText}`;
                }
            } catch (err) {
                resultText.innerHTML = CommandsMessages.connectionError;
                console.error(err);
            }
        });
    }
};
