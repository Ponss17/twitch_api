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

        if (isNewLogin) {
            Auth.saveSession({ token, apiKey, userId, login, displayName });
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('dashboard-page').classList.remove('hidden');

        const userDisplayName = document.getElementById('user-display-name');
        const userIdInput = document.getElementById('user-id');
        const userTokenInput = document.getElementById('user-token');
        const userAvatar = document.getElementById('user-avatar');

        if (userDisplayName) userDisplayName.textContent = displayName || login;
        if (userIdInput) userIdInput.value = userId;

        if (userTokenInput) {
            userTokenInput.value = apiKey || token;
            if (apiKey) {
                const label = document.querySelector('label[for="user-token"]');
                if (label) label.textContent = "API Key";
            }
        }

        if (userAvatar && sessionData.profile_image_url) {
            userAvatar.src = sessionData.profile_image_url;
            userAvatar.style.display = 'block';
        }

        this.setupEventListeners();
        this.setupNavigation();
        this.setupFollowCommand();
        this.setupClipCommand();
        this.setupApiTest();
        this.loadAnalytics();
    },

    setupEventListeners() {
        const toggleTokenBtn = document.getElementById('toggle-token');
        const regenerateBtn = document.getElementById('regenerate-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const refreshClipsBtn = document.getElementById('refresh-clips-btn');

        if (toggleTokenBtn) {
            toggleTokenBtn.addEventListener('click', () => {
                const input = document.getElementById('user-token');
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.regenerateKey(this.state.session.apiKey);
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        if (refreshClipsBtn) {
            refreshClipsBtn.addEventListener('click', () => this.loadClips());
        }
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabPanes = document.querySelectorAll('.tab-pane');
        const pageTitle = document.getElementById('page-title');

        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                if (!targetId) return;

                navItems.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === targetId) {
                        pane.classList.add('active');
                    }
                });

                const navText = btn.querySelector('.nav-text');
                if (pageTitle && navText) {
                    pageTitle.textContent = navText.textContent;
                }

                if (targetId === 'tab-clips') this.loadClips();
            });
        });
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

        if (!login || (!apiKey && !token)) {
            console.warn('Missing credentials for followage command');
            return;
        }

        const bot = botSelect.value;
        const domain = window.location.origin;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        let cmd = '';

        if (bot === 'nightbot') {
            cmd = `$(urlfetch ${domain}/api/followage/$(touser)/${login}?${tokenParam})`;
        } else if (bot === 'streamelements' || bot === 'fossabot') {
            cmd = `$(customapi ${domain}/api/followage/\${user}/${login}?${tokenParam})`;
        } else if (bot === 'wizebot') {
            cmd = `$(urlfetch ${domain}/api/followage/$(user_name)/${login}?${tokenParam})`;
        }

        output.value = `!addcom !followage ${cmd}`;
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

        if (!login || (!apiKey && !token)) {
            console.warn('Missing credentials for clip command');
            return;
        }

        const bot = botSelect.value;
        const domain = window.location.origin;
        const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        let cmd = '';

        if (bot === 'nightbot') {
            cmd = `🎬 Clip creado por $(user): $(urlfetch ${domain}/api/clip?channel=${login}&${tokenParam})`;
        } else if (bot === 'wizebot') {
            cmd = `🎬 Clip creado por $(user_name): $(urlfetch ${domain}/api/clip?channel=${login}&${tokenParam})`;
        } else {
            cmd = `🎬 Clip creado por \${user}: $(customapi ${domain}/api/clip?channel=${login}&${tokenParam})`;
        }

        output.value = `!addcom !clip ${cmd}`;
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

        const channel = testChannelInput.value || login;
        const user = testUserInput.value || login;

        testResultText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando conexión...';
        testResultContainer.classList.remove('hidden');

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/followage/${user}/${channel}?${tokenParam}`);

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

            UI.showToast('⚠️ Error en la prueba de API', 'error');
        }
    },

    async loadAnalytics() {
        const statsContainer = document.getElementById('stat-clips');
        if (!statsContainer) return;

        try {
            const { apiKey, token } = this.state.session;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/analytics?${tokenParam}`);

            if (!res.ok) {
                throw new Error('No se pudieron cargar las estadísticas');
            }

            const stats = await res.json();
            document.getElementById('stat-clips').textContent = stats.clips || 0;
            document.getElementById('stat-followage').textContent = stats.followage || 0;
        } catch (e) {
            console.error('Error loading analytics:', e);
            document.getElementById('stat-clips').textContent = '--';
            document.getElementById('stat-followage').textContent = '--';
        }
    },

    async loadClips() {
        const clipsGallery = document.getElementById('clips-gallery');
        if (!clipsGallery) return;

        clipsGallery.innerHTML = `
            <div class="loading">
                <i class="fa-solid fa-spinner fa-spin"></i> 
                <p style="margin-top:10px;">Cargando clips...</p>
            </div>
        `;

        const { login, apiKey, token } = this.state.session;

        try {
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/get-clips?channel=${login}&${tokenParam}`);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            this.renderClips(data);
        } catch (error) {
            console.error('Error loading clips:', error);
            clipsGallery.innerHTML = `
                <div class="error-state">
                    <i class="fa-solid fa-triangle-exclamation error-icon"></i>
                    <h3>No se pudieron cargar los clips</h3>
                    <p>${error.message || 'Ocurrió un error al conectar con el servidor'}</p>
                    <button class="btn-primary" onclick="Dashboard.loadClips()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>
            `;
            UI.showToast('⚠️ Error al cargar clips', 'error');
        }
    },

    renderClips(clips) {
        const clipsGallery = document.getElementById('clips-gallery');

        if (!clips || clips.length === 0) {
            clipsGallery.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-film empty-icon"></i>
                    <h3>No hay clips todavía</h3>
                    <p>Crea tu primer clip usando el comando <code>!clip</code> en tu chat de Twitch</p>
                    <div class="empty-actions" style="margin-top:20px;">
                        <a href="#" class="btn-primary" onclick="event.preventDefault(); document.querySelector('[data-tab=tab-clips]').scrollIntoView({behavior:'smooth'});">
                            <i class="fa-solid fa-wrench"></i> Ver cómo configurar
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        clipsGallery.innerHTML = '';
        const fragment = document.createDocumentFragment();

        clips.forEach(clip => {
            const card = document.createElement('div');
            card.className = 'clip-card';

            const safeTitle = UI.escapeHTML(clip.title);
            const safeUrl = UI.escapeHTML(clip.url);
            const safeThumb = UI.escapeHTML(clip.thumbnail_url);
            const dateStr = new Date(clip.created_at).toLocaleDateString();

            card.innerHTML = `
                <a href="${safeUrl}" target="_blank" class="clip-link">
                    <img src="${safeThumb}" class="clip-thumb" alt="${safeTitle}" loading="lazy">
                    <div class="clip-info">
                        <div class="clip-title" title="${safeTitle}">${safeTitle}</div>
                        <div class="clip-meta">
                            <span><i class="fa-solid fa-eye"></i> ${clip.view_count}</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </a>
            `;
            fragment.appendChild(card);
        });

        clipsGallery.appendChild(fragment);
    },

    async regenerateKey(currentKey) {
        if (!confirm('¿Generar una nueva API Key? La anterior dejará de funcionar.')) {
            return;
        }

        const regenerateBtn = document.getElementById('regenerate-btn');
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/api/regenerate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: currentKey })
            });

            if (!res.ok) throw new Error('Error al regenerar');

            const data = await res.json();
            this.state.session.apiKey = data.apiKey;
            Auth.saveSession(this.state.session);
            document.getElementById('user-token').value = data.apiKey;
            this.updateFollowCommand();
            this.updateClipCommand();
            UI.showToast('Nueva API Key generada');
        } catch (e) {
            alert('Error al generar Key');
        } finally {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        }
    }
};
