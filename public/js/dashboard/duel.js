import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';

export const DuelModule = {
    session: null,
    initialized: false,

    init(session) {
        if (this.initialized) return;
        this.initialized = true;
        this.session = session;

        Loader.loadCSS('./css/sections/duel.css');
        this.setupUI();
    },

    setupUI() {
        this.setupCommandGenerator();

        const fightBtn = document.getElementById('btn-test-duel');
        if (fightBtn) {
            fightBtn.addEventListener('click', () => this.runTestDuel());
        }
    },

    setupCommandGenerator() {
        const botSelect = document.getElementById('bot-select-duel');
        if (botSelect) {
            botSelect.addEventListener('change', () => this.renderCommandBox());
        }

        const copyBtn = document.querySelector('.copy-btn[data-target="command-output-duel"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const output = document.getElementById('command-output-duel');
                if (output) {
                    UI.copyToClipboard(output.value);
                    UI.showToast(Messages.Duel.copied, 'success');
                }
            });
        }

        this.renderCommandBox();
    },

    renderCommandBox() {
        const output = document.getElementById('command-output-duel');
        const botSelect = document.getElementById('bot-select-duel');

        if (!output || !this.session) return;

        const bot = botSelect ? botSelect.value : 'nightbot';
        const { apiKey, token, login } = this.session;
        const credential = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/twitch/minigames/duel?${credential}`;

        let cmd = '';

        if (bot === 'nightbot') {
            cmd = `$(urlfetch ${apiUrl}&challenger=$(user)&opponent=$(touser))`;
        } else if (bot === 'streamelements' || bot === 'fossabot') {
            cmd = `$(customapi ${apiUrl}&challenger=\${user}&opponent=\${1})`;
        } else if (bot === 'wizebot') {
            cmd = `$(urlfetch ${apiUrl}&challenger=$(user_name)&opponent=$(arg_1))`;
        }

        output.value = `!addcom !duelo ${cmd}`;
    },

    async runTestDuel() {
        const p1Input = document.getElementById('duel-p1');
        const p2Input = document.getElementById('duel-p2');
        const resultContainer = document.getElementById('duel-result');

        if (!p1Input || !p2Input) return;

        const challenger = p1Input.value.trim() || 'Heroe';
        const opponent = p2Input.value.trim() || 'Villano';

        if (!challenger || !opponent) {
            UI.showToast(Messages.Duel.missingNames, 'warning');
            return;
        }

        const btn = document.getElementById('btn-test-duel');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = Messages.Duel.fighting;

        if (resultContainer) {
            resultContainer.innerHTML = '<i>La batalla ha comenzado en el chat...</i>';
            resultContainer.classList.remove('hidden');
        }

        try {
            const { apiKey, token } = this.session;
            const credential = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

            const url = `/api/twitch/minigames/duel?challenger=${encodeURIComponent(challenger)}&opponent=${encodeURIComponent(opponent)}&${credential}`;

            const res = await fetch(url);
            const text = await res.text();

            if (res.ok) {
                UI.showToast(Messages.Duel.started, 'success');
                if (resultContainer) {
                    if (!text || text.trim().length === 0) {
                        resultContainer.innerHTML = `
                            <div class="duel-result-msg">
                                <i class="fa-solid fa-check-circle"></i> <strong>${Messages.Duel.sentTitle}</strong><br>
                                <span class="duel-text-small">${Messages.Duel.sentDesc}</span>
                            </div>
                        `;
                    } else {
                        resultContainer.innerText = `Respuesta: "${text}"`;
                    }
                }
            } else {
                UI.showToast(Messages.Duel.error, 'error');
            }

        } catch (e) {
            console.error(e);
            UI.showToast(Messages.Common.networkError, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};
