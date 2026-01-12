import { Auth } from '../auth.js';
import { UI } from '../ui.js';
import { CommandsModule } from './commands.js';
import { Messages } from '../utils/messages.js';

export const SettingsModule = {
    session: null,

    init(session) {
        this.session = session;
        console.log('[SettingsModule] Initialized');
        this.setupApiTest();
        this.setupTokenToggle();
        this.setupRegenerate();
    },

    setupTokenToggle() {
        const toggleTokenBtn = document.getElementById('toggle-token');
        if (toggleTokenBtn) {
            const newBtn = toggleTokenBtn.cloneNode(true);
            toggleTokenBtn.parentNode.replaceChild(newBtn, toggleTokenBtn);

            newBtn.addEventListener('click', () => {
                const input = document.getElementById('user-token');
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        }
    },

    setupRegenerate() {
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            const newBtn = regenerateBtn.cloneNode(true);
            regenerateBtn.parentNode.replaceChild(newBtn, regenerateBtn);

            newBtn.addEventListener('click', () => {
                this.regenerateKey(this.session.apiKey);
            });
        }
    },

    setupApiTest() {
        const runTestBtn = document.getElementById('run-test-btn');
        if (runTestBtn) {
            const newBtn = runTestBtn.cloneNode(true);
            runTestBtn.parentNode.replaceChild(newBtn, runTestBtn);
            newBtn.addEventListener('click', () => this.runApiTest());
        }
    },

    async runApiTest() {
        const testChannelInput = document.getElementById('test-channel');
        const testUserInput = document.getElementById('test-user');
        const testResultText = document.getElementById('test-result-text');
        const testResultContainer = document.getElementById('test-result-container');
        const { login, apiKey, token } = this.session;

        const channel = testChannelInput.value || login;
        const user = testUserInput.value || login;

        testResultText.innerHTML = Messages.Settings.testing;
        testResultContainer.classList.remove('hidden');

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`api/followage?user=${user}&channel=${channel}&${tokenParam}`);

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const text = await res.text();

            testResultText.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-check-circle';
            icon.style.color = 'var(--success)';
            testResultText.appendChild(icon);
            testResultText.appendChild(document.createTextNode(' ' + text));

        } catch (e) {
            testResultText.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-xmark-circle';
            icon.style.color = 'var(--danger)';
            testResultText.appendChild(icon);
            testResultText.appendChild(document.createTextNode(' Error: ' + e.message));

            UI.showToast(Messages.Settings.testError, 'error');
        }
    },

    async regenerateKey(currentKey) {
        if (!confirm(Messages.Settings.regenerateConfirm)) {
            return;
        }

        const regenerateBtn = document.getElementById('regenerate-btn');
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = Messages.Settings.loadingIcon;

        try {
            const res = await fetch('api/regenerate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: currentKey })
            });

            if (!res.ok) throw new Error('Error al regenerar');

            const data = await res.json();

            this.session.apiKey = data.apiKey;
            Auth.saveSession(this.session);

            document.getElementById('user-token').value = data.apiKey;

            CommandsModule.init(this.session);

            UI.showToast(Messages.Settings.regenerateSuccess);
        } catch (e) {
            console.error(e);
            alert(Messages.Settings.regenerateError);
        } finally {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = Messages.Settings.rotateIcon;
        }
    }
};
