import { CONFIG } from '../../../config.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { CommandsMessages } from './messages.js';
import { CommandGenerator } from '../../../shared/utils/commandGenerator.js';
import { COMMAND_CONFIG } from './config.js';
import { CommandTemplates } from './templates.js';
import { UI } from '../../../core/ui.js';
import { Session } from '../../../types.js';
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
    uiInitialized: false,

    async init(session: Session) {
        this.session = session;
        if (!this.session) return;
        this.initialized = true;
    },

    activate() {
        this.renderCommandCards();
        this.setupGenericCommands();

        if (!this.uiInitialized) {
            this.setupTestCommand();
            this.setupTestShoutout();
            this.uiInitialized = true;
        }

        if (this.session?.login) {
            const soChannel = document.getElementById('so-test-channel') as HTMLInputElement;
            if (soChannel && !soChannel.value) soChannel.value = this.session.login;
        }

        Object.values(COMMAND_CONFIG).forEach((conf) => {
            this.updateCommand(conf as CommandConfigItem);
        });
    },

    deactivate() {},

    renderCommandCards() {
        Object.values(COMMAND_CONFIG).forEach((conf) => {
            const config = conf as CommandConfigItem;
            const container = document.getElementById(config.containerId);
            if (!container || container.dataset.rendered === 'true') return;

            container.innerHTML = CommandTemplates.generateCard(config);
            container.dataset.rendered = 'true';
        });
    },

    setupGenericCommands() {
        Object.values(COMMAND_CONFIG).forEach((conf) => {
            const config = conf as CommandConfigItem;
            const botSelect = document.getElementById(`bot-select-${config.id}`);
            const output = document.getElementById(`command-output-${config.id}`);
            const templateInput = document.getElementById(`${config.id}-template`);
            const formatSelect = document.getElementById(`copy-format-${config.id}`);

            if (botSelect && output && !botSelect.dataset.listener) {
                const updateFn = () => this.updateCommand(config);

                botSelect.addEventListener('change', updateFn);
                if (templateInput) templateInput.addEventListener('input', updateFn);
                if (formatSelect) formatSelect.addEventListener('change', updateFn);
                if (config.extraSelectors) {
                    config.extraSelectors.forEach((sel) => {
                        const selEl = document.getElementById(`extra-${config.id}-${sel.id}`);
                        if (selEl) selEl.addEventListener('change', updateFn);
                    });
                }

                botSelect.dataset.listener = 'true';
                updateFn();
            }
        });
    },

    updateCommand(conf: CommandConfigItem) {
        const botSelect = document.getElementById(`bot-select-${conf.id}`) as HTMLSelectElement;
        const output = document.getElementById(`command-output-${conf.id}`) as HTMLInputElement;
        const templateInput = document.getElementById(`${conf.id}-template`) as HTMLInputElement;
        const formatSelect = document.getElementById(`copy-format-${conf.id}`) as HTMLSelectElement;

        if (!botSelect || !output) return;
        if (!this.session) return;

        const { login, apiKey, token } = this.session;
        const currentApiKey = apiKey || '';

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey
            ? `apiKey=${encodeURIComponent(apiKey)}`
            : token
              ? `token=${encodeURIComponent(token)}`
              : '';
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

        const result = conf.generate(
            domain,
            login,
            tokenParam,
            bot,
            templateVal,
            queryParams,
            extraValues
        );

        const format = formatSelect ? formatSelect.value : 'full';
        const realCmd = format === 'full' ? result.full : result.url;
        const maskedCmd = realCmd.split(currentApiKey).join('**************');

        output.value = maskedCmd;
        output.dataset.realValue = realCmd;
    },

    _runApiTest(
        btnId: string,
        resultBoxId: string,
        resultTextId: string,
        buildUrl: () => string | null
    ) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.parentNode!.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const resultBox = document.getElementById(resultBoxId)!;
            const resultText = document.getElementById(resultTextId)!;
            const url = buildUrl();

            if (!url) {
                resultBox.classList.add('active', 'error');
                resultBox.classList.remove('success');
                resultText.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${CommandsMessages.completeFields}`;
                return;
            }

            resultBox.classList.add('active');
            resultBox.classList.remove('success', 'error');
            resultText.innerHTML = CommandsMessages.testing;

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
    },

    setupTestCommand() {
        if (!this.session) return;
        const { apiKey, token } = this.session;
        const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey
            ? `apiKey=${encodeURIComponent(apiKey)}`
            : token
              ? `token=${encodeURIComponent(token)}`
              : '';

        this._runApiTest('run-test-btn', 'test-result-container', 'test-result-text', () => {
            const channel = (
                document.getElementById('test-channel') as HTMLInputElement
            ).value.trim();
            const user = (document.getElementById('test-user') as HTMLInputElement).value.trim();
            if (!channel || !user) return null;
            return `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;
        });
    },

    setupTestShoutout() {
        if (!this.session) return;
        const { apiKey, token, login } = this.session;
        const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
        const tokenParam = apiKey
            ? `apiKey=${encodeURIComponent(apiKey)}`
            : token
              ? `token=${encodeURIComponent(token)}`
              : '';

        this._runApiTest(
            'run-so-test-btn',
            'so-test-result-container',
            'so-test-result-text',
            () => {
                const channel =
                    (document.getElementById('so-test-channel') as HTMLInputElement).value.trim() ||
                    login;
                const touser = (
                    document.getElementById('so-test-touser') as HTMLInputElement
                ).value.trim();
                if (!touser) return null;
                return `${domain}/shoutout?channel=${channel}&touser=${touser}&${tokenParam}`;
            }
        );
    }
};
