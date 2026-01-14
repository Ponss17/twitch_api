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
                            if (input.type === 'password') {
                                input.type = 'text';
                                newBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
                            } else {
                                input.type = 'password';
                                newBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
                            }
                        });
                    }
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
    }
};
