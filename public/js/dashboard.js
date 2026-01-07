import { CONFIG } from './config.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const Dashboard = {
    state: {
        session: null
    },

    init(sessionData) {
        this.state.session = sessionData;

        const { apiKey, token, displayName, login, userId, isNewLogin } = sessionData;
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const userDisplayName = document.getElementById('user-display-name');
        const userIdInput = document.getElementById('user-id');
        const userTokenInput = document.getElementById('user-token');
        const toggleTokenBtn = document.getElementById('toggle-token');
        const regenerateBtn = document.getElementById('regenerate-btn');

        if (isNewLogin) {
            Auth.saveSession({ token, apiKey, userId, login, displayName });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userDisplayName.textContent = displayName || login;
        userIdInput.value = userId;

        if (apiKey) {
            userTokenInput.value = apiKey;
            const label = document.querySelector('label[for="user-token"]');
            if (label) label.textContent = "API Key (No expira)";
        } else {
            userTokenInput.value = token;
        }

        if (toggleTokenBtn) {
            toggleTokenBtn.addEventListener('click', () => {
                userTokenInput.type = userTokenInput.type === 'password' ? 'text' : 'password';
            });
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateKey(apiKey));
        }

        this.setupFollowCommand();
        this.setupClipCommand();
        this.setupApiTest();
    },

    setupFollowCommand() {
        const botSelect = document.getElementById('bot-select-follow');
        const output = document.getElementById('command-output-follow');

        if (botSelect && output) {
            botSelect.addEventListener('change', () => this.updateFollowCommand());
            this.updateFollowCommand();
        }
    },

    updateFollowCommand() {
        const botSelect = document.getElementById('bot-select-follow');
        const output = document.getElementById('command-output-follow');
        const { login, apiKey, token } = this.state.session;

        if (!login) return;

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = apiKey ? `&apiKey=${apiKey}` : (token ? `&token=${token}` : '');
        let cmd = '';

        if (bot === 'nightbot') cmd = `$(urlfetch ${domain}/api/followage?channel=${login}&user=$(touser)${tokenParam})`;
        else if (bot === 'streamelements' || bot === 'fossabot') cmd = `$(customapi ${domain}/api/followage?channel=${login}&user=\${user}${tokenParam})`;
        else if (bot === 'wizebot') cmd = `$(urlfetch ${domain}/api/followage?channel=${login}&user=$(user_name)${tokenParam})`;

        const fullCommand = `!addcom !followage ${cmd}`;
        output.dataset.realValue = fullCommand;

        if (apiKey || token) {
            const maskedToken = '•'.repeat(20);
            const valToMask = apiKey || token;
            output.value = fullCommand.replace(valToMask, maskedToken);
        } else {
            output.value = fullCommand;
        }
    },

    setupClipCommand() {
        const botSelect = document.getElementById('bot-select-clip');
        const output = document.getElementById('command-output-clip');

        if (botSelect && output) {
            botSelect.addEventListener('change', () => this.updateClipCommand());
            this.updateClipCommand();
        }
    },

    updateClipCommand() {
        const botSelect = document.getElementById('bot-select-clip');
        const output = document.getElementById('command-output-clip');
        const { login, apiKey, token } = this.state.session;

        if (!login) return;

        const bot = botSelect.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = apiKey ? `&apiKey=${apiKey}` : (token ? `&token=${token}` : '');
        let cmd = '';

        if (bot === 'nightbot') cmd = `🎬 Clip creado por $(user): $(urlfetch ${domain}/api/create-clip?channel=${login}${tokenParam})`;
        else if (bot === 'wizebot') cmd = `🎬 Clip creado por $(user_name): $(urlfetch ${domain}/api/create-clip?channel=${login}${tokenParam})`;
        else cmd = `🎬 Clip creado por \${user}: $(customapi ${domain}/api/create-clip?channel=${login}${tokenParam})`;

        const fullCommand = `!addcom !clip ${cmd}`;
        output.dataset.realValue = fullCommand;

        if (apiKey || token) {
            const maskedToken = '•'.repeat(20);
            const valToMask = apiKey || token;
            output.value = fullCommand.replace(valToMask, maskedToken);
        } else {
            output.value = fullCommand;
        }
    },

    async loadClips() {
        const clipsGallery = document.getElementById('clips-gallery');
        if (!clipsGallery) return;

        clipsGallery.innerHTML = Array(4).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-thumb"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text skeleton-title"></div>
                    <div class="skeleton-text skeleton-title" style="width: 60%"></div>
                    <div class="skeleton-text skeleton-meta"></div>
                </div>
            </div>
        `).join('');

        const { login, apiKey, token } = this.state.session;

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`api/get-clips?channel=${login}&${tokenParam}`);
            if (!res.ok) throw new Error('Error fetch');
            const data = await res.json();

            this.renderClips(data);
        } catch (error) {
            clipsGallery.innerHTML = '<div style="text-align:center; padding:20px; color:var(--warning-color)">Error cargando clips.</div>';
        }
    },

    renderClips(clips) {
        const clipsGallery = document.getElementById('clips-gallery');
        if (clips.length === 0) {
            clipsGallery.innerHTML = '<div style="text-align:center; padding:20px;">No hay clips recientes.</div>';
            return;
        }

        clipsGallery.innerHTML = '';
        clips.forEach(clip => {
            const card = document.createElement('div');
            card.className = 'clip-card';
            card.innerHTML = `
                <a href="${clip.url}" target="_blank" class="clip-link">
                    <img src="${clip.thumbnail_url}" class="clip-thumb" alt="${clip.title}">
                    <div class="clip-info">
                        <div class="clip-title" title="${clip.title}">${clip.title}</div>
                        <div class="clip-meta">
                            <span><i class="fa-solid fa-eye"></i> ${clip.view_count}</span>
                            <span>${new Date(clip.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </a>
            `;
            clipsGallery.appendChild(card);
        });
    },

    setupApiTest() {
        const runTestBtn = document.getElementById('run-test-btn');
        if (runTestBtn) {
            runTestBtn.addEventListener('click', () => this.runApiTest());
        }
    },

    async runApiTest() {
        const testChannelInput = document.getElementById('test-channel');
        const testUserInput = document.getElementById('test-user');
        const testResultText = document.getElementById('test-result-text');
        const testResultContainer = document.getElementById('test-result-container');
        const { login, apiKey, token } = this.state.session;
        const ch = testChannelInput.value || login;
        const u = testUserInput.value || login;

        testResultText.textContent = '...';
        testResultContainer.classList.remove('hidden');

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const r = await fetch(`api/followage?channel=${ch}&user=${u}&${tokenParam}`);
            const t = await r.text();
            testResultText.textContent = t;
        } catch (e) {
            testResultText.textContent = "Error de conexión.";
        }
    },

    async regenerateKey(currentKey) {
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (!confirm('⚠ ¿Estás seguro de que quieres generar una NUEVA API Key?\n\nLos comandos que ya tengas en tu chat DEJARÁN DE FUNCIONAR hasta que los actualices con la nueva llave.')) {
            return;
        }

        try {
            regenerateBtn.disabled = true;
            regenerateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const res = await fetch(`api/regenerate-key?apiKey=${currentKey}`, { method: 'POST' });
            if (!res.ok) throw new Error('Error al regenerar');

            const data = await res.json();

            this.state.session.apiKey = data.apiKey;
            Auth.saveSession(this.state.session);
            document.getElementById('user-token').value = data.apiKey;
            this.updateFollowCommand();
            this.updateClipCommand();
            UI.showToast('<i class="fa-solid fa-check"></i> Nueva Key Generada');

        } catch (e) {
            alert('Error al generar nueva clave. Inténtalo más tarde.');
        } finally {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        }
    }
};
