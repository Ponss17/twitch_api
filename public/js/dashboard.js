import { StalkerModule } from './dashboard/stalker.js';
import { TrendsModule } from './dashboard/trends.js';
import { ClipsModule } from './dashboard/clips.js';
import { RouletteModule } from './dashboard/roulette.js';
import { CommandsModule } from './dashboard/commands.js';
import { UI } from './ui.js';

export const Dashboard = {
    session: null,

    init(session) {
        this.session = session;
        this.setupTabs();
        this.setupUserBadge();

        this.loadTab('tab-home');
        this.setupFeedback();

        CommandsModule.init(session);
    },

    setupUserBadge() {
        const { displayName, profile_image_url } = this.session;
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-display-name');

        if (avatar && profile_image_url) {
            avatar.src = profile_image_url;
            avatar.style.display = 'block';
        }
        if (name && displayName) {
            name.innerText = displayName;
        }

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            import('./auth.js').then(m => m.Auth.logout());
        });
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.nav-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('external-link')) return;

                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                document.getElementById(tabId)?.classList.add('active');

                this.loadTab(tabId);
            });
        });
    },

    loadTab(tabId) {
        switch (tabId) {
            case 'tab-home':
                if (this.session) {
                    const userIdInput = document.getElementById('user-id');
                    const userTokenInput = document.getElementById('user-token');
                    if (userIdInput) userIdInput.value = this.session.userId || '';
                    if (userTokenInput) {
                        userTokenInput.value = this.session.apiKey || this.session.token || '';
                        userTokenInput.dataset.realValue = this.session.apiKey || this.session.token || '';
                    }

                    const toggleBtn = document.getElementById('toggle-token');
                    if (toggleBtn) {
                        const newBtn = toggleBtn.cloneNode(true);
                        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
                        newBtn.addEventListener('click', () => {
                            const input = document.getElementById('user-token');
                            const icon = newBtn.querySelector('i');
                            if (input.type === 'password') {
                                input.type = 'text';
                                icon.classList.replace('fa-eye', 'fa-eye-slash');
                            } else {
                                input.type = 'password';
                                icon.classList.replace('fa-eye-slash', 'fa-eye');
                            }
                        });
                    }

                    this.setupRegenerate();

                    this.loadAnalytics();
                }
                break;
            case 'tab-followage':
                CommandsModule.init(this.session);
                break;
            case 'tab-clips':
                ClipsModule.init(this.session);
                break;
            case 'tab-tracker':
                TrendsModule.init(this.session);
                break;
            case 'tab-stalker':
                StalkerModule.init(this.session);
                break;
            case 'tab-roulette':
                RouletteModule.init(this.session);
                break;
        }
    },

    setupRegenerate() {
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            const newBtn = regenerateBtn.cloneNode(true);
            regenerateBtn.parentNode.replaceChild(newBtn, regenerateBtn);

            newBtn.addEventListener('click', async () => {
                if (!confirm('¿Estás seguro de que quieres regenerar tu API Key? La anterior dejará de funcionar inmediatamente.')) return;

                newBtn.disabled = true;
                const originalIcon = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                try {
                    const { apiKey, token } = this.session;
                    const res = await fetch('/api/twitch/regenerate-key', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ key: apiKey })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const newSession = { ...this.session, apiKey: data.apiKey };
                        localStorage.setItem('twitch_session', JSON.stringify(newSession));
                        this.session = newSession;

                        const userTokenInput = document.getElementById('user-token');
                        if (userTokenInput) {
                            userTokenInput.value = data.apiKey;
                            userTokenInput.dataset.realValue = data.apiKey;
                        }
                        UI.showToast('API Key regenerada correctamente', 'success');
                    } else {
                        throw new Error('Error al regenerar');
                    }
                } catch (e) {
                    console.error(e);
                    UI.showToast('Error al regenerar API Key', 'error');
                } finally {
                    newBtn.disabled = false;
                    newBtn.innerHTML = originalIcon;
                }
            });
        }
    },

    async loadAnalytics() {
        try {
            const { apiKey, token } = this.session;
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const res = await fetch(`/api/twitch/analytics?${tokenParam}`);

            if (res.ok) {
                const stats = await res.json();
                const clipsEl = document.getElementById('stat-clips');
                const followEl = document.getElementById('stat-followage');
                if (clipsEl) clipsEl.textContent = stats.clips || 0;
                if (followEl) followEl.textContent = stats.followage || 0;
            }
        } catch (e) {
            console.error('Error analytics', e);
        }
    },

    setupFeedback() {
        const sendFeedbackBtn = document.getElementById('send-feedback-btn');
        if (sendFeedbackBtn) {
            sendFeedbackBtn.addEventListener('click', async () => {
                const messageInput = document.getElementById('feedback-message');
                const message = messageInput.value.trim();

                if (!message) {
                    UI.showToast('Por favor escribe un mensaje primero.', 'error');
                    return;
                }

                sendFeedbackBtn.disabled = true;
                const originalText = sendFeedbackBtn.innerHTML;
                sendFeedbackBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

                try {
                    const { apiKey, token } = this.session;
                    const headers = { 'Content-Type': 'application/json' };
                    let url = '/api/twitch/feedback';

                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    } else if (apiKey) {
                        url += `?apiKey=${apiKey}`;
                    }

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ message })
                    });

                    if (response.ok) {
                        UI.showToast('¡Feedback enviado! Gracias 🐶', 'success');
                        messageInput.value = '';
                    } else {
                        throw new Error('Error al enviar');
                    }
                } catch (e) {
                    console.error(e);
                    UI.showToast('Error al enviar feedback', 'error');
                } finally {
                    sendFeedbackBtn.disabled = false;
                    sendFeedbackBtn.innerHTML = originalText;
                }
            });
        }
    },
};
