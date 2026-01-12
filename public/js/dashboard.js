import { Auth } from './auth.js';
import { AnalyticsModule } from './dashboard/analytics.js';
import { SettingsModule } from './dashboard/settings.js';
import { CommandsModule } from './dashboard/commands.js';

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

        this.renderUserInfo(sessionData);

        AnalyticsModule.init(sessionData);
        SettingsModule.init(sessionData);

        this.setupNavigation();
        this.setupEventListeners();
    },

    renderUserInfo(session) {
        const { displayName, login, apiKey, token, profile_image_url, userId } = session;

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

        if (userAvatar && profile_image_url) {
            userAvatar.src = profile_image_url;
            userAvatar.style.display = 'block';
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

                this.handleTabChange(targetId);
            });
        });
    },

    handleTabChange(tabId) {
        const { session } = this.state;

        if (tabId === 'tab-clips') {
            import('./dashboard/clips.js')
                .then(module => {
                    module.ClipsModule.init(session);
                })
                .catch(err => console.error('Failed to load Clips module:', err));
        }
        else if (tabId === 'tab-followage') {
            CommandsModule.init(session);
        }
        else if (tabId === 'tab-stalker') {
            import('./dashboard/stalker.js')
                .then(module => {
                    module.StalkerModule.init(session);
                })
                .catch(err => console.error('Failed to load Stalker module:', err));
        }
        else if (tabId === 'tab-tracker') {
            import('./dashboard/trends.js')
                .then(module => {
                    module.TrendsModule.init(session.login, session.displayName);
                })
                .catch(err => console.error('Failed to load Trends module:', err));
        }
    },

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }
    }
};
