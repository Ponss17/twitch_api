import { StalkerModule } from './dashboard/stalker.js';
import { Messages } from './utils/messages.js';
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
                if (!confirm(Messages.Settings.confirmRegenerate)) return;

                newBtn.disabled = true;
                const originalIcon = newBtn.innerHTML;
                newBtn.innerHTML = Messages.Settings.loadingIcon;

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
                        UI.showToast(Messages.Settings.regenerateSuccess, 'success');
                    } else {
                        throw new Error('Error al regenerar');
                    }
                } catch (e) {
                    console.error(e);
                    UI.showToast(Messages.Settings.regenerateError, 'error');
                } finally {
                    newBtn.disabled = false;
                    newBtn.innerHTML = originalIcon;
                }
            });
        }
    },

    async loadAnalytics() {
        const statsContainer = document.getElementById('stats-grid');
        if (!statsContainer) return;

        statsContainer.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i></div>';

        try {
            const { token } = this.session;
            const res = await fetch('/api/twitch/dashboard/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                statsContainer.innerHTML = '';

                const icons = {
                    clips: 'fa-film',
                    followage: 'fa-clock',
                    so: 'fa-users',
                    default: 'fa-chart-simple'
                };

                const labels = {
                    clips: 'Clips Creados',
                    followage: 'Followage Check',
                    so: 'Shoutouts'
                };

                if (Object.keys(data).length === 0) {
                    statsContainer.innerHTML = '<p class="text-muted">No hay estadísticas aún. ¡Usa tus comandos!</p>';
                    return;
                }

                Object.entries(data).forEach(([key, value]) => {
                    if (key.startsWith('_')) return;

                    const icon = icons[key] || icons.default;
                    const label = labels[key] || key.charAt(0).toUpperCase() + key.slice(1);

                    const card = document.createElement('div');
                    card.className = 'stat-card';
                    card.innerHTML = `
                        <div class="stat-icon"><i class="fa-solid ${icon}"></i></div>
                        <div class="stat-info">
                            <h3>${value}</h3>
                            <p>${label}</p>
                        </div>
                    `;
                    statsContainer.appendChild(card);
                });
            } else {
                statsContainer.innerHTML = '<p class="error-text">No se pudieron cargar las estadísticas.</p>';
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
            statsContainer.innerHTML = '<p class="error-text">Error de conexión.</p>';
        }
    },

    setupFeedback() {
        const sendFeedbackBtn = document.getElementById('send-feedback-btn');
        if (sendFeedbackBtn) {
            sendFeedbackBtn.addEventListener('click', async () => {
                const messageInput = document.getElementById('feedback-message');
                const message = messageInput.value.trim();

                if (!message) {
                    UI.showToast(Messages.Feedback.emptyMessage, 'error');
                    return;
                }

                sendFeedbackBtn.disabled = true;
                const originalText = sendFeedbackBtn.innerHTML;
                sendFeedbackBtn.innerHTML = Messages.Feedback.sending;

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
                        UI.showToast(Messages.Feedback.success, 'success');
                        messageInput.value = '';
                    } else {
                        throw new Error('Error al enviar');
                    }
                } catch (e) {
                    console.error(e);
                    UI.showToast(Messages.Feedback.error, 'error');
                } finally {
                    sendFeedbackBtn.disabled = false;
                    sendFeedbackBtn.innerHTML = originalText;
                }
            });
        }
    },
};
