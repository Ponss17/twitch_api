import { CONFIG } from '../../../config.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { CommandsMessages } from './messages.js';
import { CommandGenerator } from '../../../shared/utils/commandGenerator.js';
import { COMMAND_CONFIG } from './config.js';
import { CommandTemplates } from './templates.js';
import { Session } from '../../../types.js';
import { CommandConfigItem } from './types.js';
import { dashboardStore, CommandsActions, ToastActions } from '../../../core/dashboardStore.js';

declare global {
    interface Window {
        CommandUtils: { CommandGenerator: typeof CommandGenerator };
    }
}

window.CommandUtils = { CommandGenerator };

interface ICommandsModule {
    session: Session | null;
    initialized: boolean;
    uiInitialized: boolean;
    unsubscribers: Array<() => void>;
    init(session: Session): Promise<void>;
    activate(): void;
    deactivate(): void;
    setupStoreSubscriptions(): void;
    renderCommandCards(): void;
    setupGenericCommands(): void;
    updateCommand(conf: CommandConfigItem): void;
    setupTestCommand(): void;
    setupTestShoutout(): void;
    restoreCommandValues(
        commandId: string,
        config: { bot: string; template: string; extraValues: Record<string, string> }
    ): void;
    updateCommandOutput(commandId: string, masked: string, full: string): void;
    updateTestResultUI(testId: string, status: 'success' | 'error' | null, message: string): void;
}

export const CommandsModule: ICommandsModule = {
    session: null,
    initialized: false,
    uiInitialized: false,
    unsubscribers: [],

    async init(session: Session) {
        this.session = session;
        if (!this.session) return;
        this.initialized = true;
    },

    activate() {
        this.renderCommandCards();
        this.setupGenericCommands();
        this.setupStoreSubscriptions();

        if (!this.uiInitialized) {
            this.setupTestCommand();
            this.setupTestShoutout();
            this.uiInitialized = true;
        }

        // Restaurar valores del store
        const state = dashboardStore.getState().commands;
        Object.keys(state.configs).forEach((commandId) => {
            this.restoreCommandValues(commandId, state.configs[commandId]);
        });

        // Generar todos los comandos inicialmente
        Object.values(COMMAND_CONFIG).forEach((conf) => {
            this.updateCommand(conf as CommandConfigItem);
        });

        if (this.session?.login) {
            const soChannel = document.getElementById('so-test-channel') as HTMLInputElement;
            if (soChannel && !soChannel.value) soChannel.value = this.session.login;
        }
    },

    deactivate() {
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];
    },

    setupStoreSubscriptions(): void {
        // Suscribirse a cambios en los comandos generados
        this.unsubscribers.push(
            dashboardStore.on('commands', (state) => {
                Object.entries(state.commands.generatedCommands).forEach(([commandId, cmd]) => {
                    this.updateCommandOutput(commandId, cmd.masked, cmd.full);
                });

                Object.entries(state.commands.testResults).forEach(([testId, result]) => {
                    this.updateTestResultUI(testId, result.status, result.message);
                });
            })
        );
    },

    restoreCommandValues(
        commandId: string,
        config: { bot: string; template: string; extraValues: Record<string, string> }
    ): void {
        const botSelect = document.getElementById(`bot-select-${commandId}`) as HTMLSelectElement;
        const templateInput = document.getElementById(`${commandId}-template`) as HTMLInputElement;

        if (botSelect && config.bot) {
            botSelect.value = config.bot;
        }
        if (templateInput && config.template) {
            templateInput.value = config.template;
        }

        // Restaurar valores de selectores extra
        if (config.extraValues) {
            Object.entries(config.extraValues).forEach(([key, value]) => {
                const selEl = document.getElementById(
                    `extra-${commandId}-${key}`
                ) as HTMLSelectElement;
                if (selEl) selEl.value = value;
            });
        }
    },

    updateCommandOutput(commandId: string, masked: string, full: string): void {
        const output = document.getElementById(`command-output-${commandId}`) as HTMLInputElement;
        if (output) {
            output.value = masked;
            output.dataset.realValue = full;
        }
    },

    updateTestResultUI(testId: string, status: 'success' | 'error' | null, message: string): void {
        const resultBox = document.getElementById(`${testId}-result-container`);
        const resultText = document.getElementById(`${testId}-result-text`);

        if (!resultBox || !resultText) return;

        if (!status) {
            resultBox.classList.remove('active', 'success', 'error');
            resultText.textContent = '';
            return;
        }

        resultBox.classList.add('active');
        resultBox.classList.remove('success', 'error');

        // Limpiar y crear contenido seguro
        resultText.textContent = '';
        const icon = document.createElement('i');
        icon.className =
            status === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-triangle-exclamation';
        resultText.appendChild(icon);
        resultText.appendChild(document.createTextNode(` ${message}`));

        resultBox.classList.add(status);
    },

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
            const botSelect = document.getElementById(
                `bot-select-${config.id}`
            ) as HTMLSelectElement;
            const templateInput = document.getElementById(
                `${config.id}-template`
            ) as HTMLInputElement;
            const formatSelect = document.getElementById(
                `copy-format-${config.id}`
            ) as HTMLSelectElement;

            if (botSelect && !botSelect.dataset.listener) {
                const updateFn = () => {
                    const bot = botSelect.value;
                    const template = templateInput ? templateInput.value.trim() : '';
                    const extraValues: Record<string, string> = {};

                    if (config.extraSelectors) {
                        config.extraSelectors.forEach((sel) => {
                            const selEl = document.getElementById(
                                `extra-${config.id}-${sel.id}`
                            ) as HTMLSelectElement;
                            if (selEl) extraValues[sel.id] = selEl.value;
                        });
                    }

                    CommandsActions.setCommandConfig(config.id, bot, template, extraValues);
                    this.updateCommand(config);
                };

                botSelect.addEventListener('change', updateFn);
                if (templateInput) templateInput.addEventListener('input', updateFn);
                if (formatSelect)
                    formatSelect.addEventListener('change', () => this.updateCommand(config));
                if (config.extraSelectors) {
                    config.extraSelectors.forEach((sel) => {
                        const selEl = document.getElementById(`extra-${config.id}-${sel.id}`);
                        if (selEl) selEl.addEventListener('change', updateFn);
                    });
                }

                botSelect.dataset.listener = 'true';
            }
        });
    },

    updateCommand(conf: CommandConfigItem) {
        const botSelect = document.getElementById(`bot-select-${conf.id}`) as HTMLSelectElement;
        const templateInput = document.getElementById(`${conf.id}-template`) as HTMLInputElement;
        const formatSelect = document.getElementById(`copy-format-${conf.id}`) as HTMLSelectElement;

        if (!botSelect) return;
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

        CommandsActions.setGeneratedCommand(conf.id, realCmd, result.url, maskedCmd);
    },

    setupTestCommand() {
        if (!this.session) return;

        const btn = document.getElementById('run-test-btn');
        if (!btn) return;

        const newBtn = btn.cloneNode(true) as HTMLElement;
        btn.parentNode!.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const channel = (
                document.getElementById('test-channel') as HTMLInputElement
            )?.value.trim();
            const user = (document.getElementById('test-user') as HTMLInputElement)?.value.trim();

            if (!channel || !user) {
                CommandsActions.setTestResult('test', 'error', CommandsMessages.completeFields);
                return;
            }

            CommandsActions.setTestResult('test', null, CommandsMessages.testing);

            try {
                const { apiKey, token } = this.session!;
                const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
                const tokenParam = apiKey
                    ? `apiKey=${encodeURIComponent(apiKey)}`
                    : token
                      ? `token=${encodeURIComponent(token)}`
                      : '';
                const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;

                const response = await fetch(url);
                const text = await response.text();

                if (response.ok) {
                    CommandsActions.setTestResult('test', 'success', text);
                    ToastActions.success('Test completado exitosamente');
                } else {
                    CommandsActions.setTestResult('test', 'error', text);
                    ToastActions.error('Error en el test');
                }
            } catch (_err) {
                CommandsActions.setTestResult('test', 'error', CommandsMessages.connectionError);
                ToastActions.error('Error de conexión');
            }
        });
    },

    setupTestShoutout() {
        if (!this.session) return;
        const { login } = this.session;

        const btn = document.getElementById('run-so-test-btn');
        if (!btn) return;

        const newBtn = btn.cloneNode(true) as HTMLElement;
        btn.parentNode!.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async () => {
            const channel =
                (document.getElementById('so-test-channel') as HTMLInputElement)?.value.trim() ||
                login;
            const touser = (
                document.getElementById('so-test-touser') as HTMLInputElement
            )?.value.trim();

            if (!touser) {
                CommandsActions.setTestResult('so-test', 'error', CommandsMessages.completeFields);
                return;
            }

            CommandsActions.setTestResult('so-test', null, CommandsMessages.testing);

            try {
                const { apiKey, token } = this.session!;
                const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
                const tokenParam = apiKey
                    ? `apiKey=${encodeURIComponent(apiKey)}`
                    : token
                      ? `token=${encodeURIComponent(token)}`
                      : '';
                const url = `${domain}/shoutout?channel=${channel}&touser=${touser}&${tokenParam}`;

                const response = await fetch(url);
                const text = await response.text();

                if (response.ok) {
                    CommandsActions.setTestResult('so-test', 'success', text);
                    ToastActions.success('Shoutout test exitoso');
                } else {
                    CommandsActions.setTestResult('so-test', 'error', text);
                    ToastActions.error('Error en shoutout');
                }
            } catch (_err) {
                CommandsActions.setTestResult('so-test', 'error', CommandsMessages.connectionError);
                ToastActions.error('Error de conexión');
            }
        });
    }
};
