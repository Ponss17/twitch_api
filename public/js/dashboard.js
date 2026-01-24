import { StalkerModule } from './dashboard/stalker.js';
import { Messages } from './utils/messages.js';
import { API_ENDPOINTS } from './utils/constants.js';
import { TrendsModule } from './dashboard/trends.js';
import { ClipsModule } from './dashboard/clips.js';
import { RouletteModule } from './dashboard/roulette.js';
import { Magic8Module } from './dashboard/magic8.js';
import { CommandsModule } from './dashboard/commands.js';
import { FeedbackModule } from './dashboard/feedback.js';
import { AnalyticsModule } from './dashboard/analytics.js';
import { AccountModule } from './dashboard/account.js';
import { UI } from './ui.js';
import { HtmlLoader } from './utils/htmlLoader.js';

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

        const pageTitle = document.getElementById('page-title');
        if (pageTitle && displayName && this.session.login) {
            pageTitle.innerHTML = `Bienvenido, <a href="https://twitch.tv/${this.session.login}" target="_blank" class="welcome-link">${displayName}</a>`;
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

    async loadTab(tabId) {
        const container = document.getElementById(tabId);
        if (container && container.dataset.src) {
            await HtmlLoader.load(container.dataset.src, tabId);
        }

        switch (tabId) {
            case 'tab-home':
                if (this.session) {
                    AccountModule.init(this.session);
                    AnalyticsModule.init(this.session);
                }
                break;
            case 'tab-followage':
                CommandsModule.init(this.session);
                break;
            case 'tab-clips':
                ClipsModule.init(this.session);
                CommandsModule.init(this.session);
                break;
            case 'tab-shoutout':
                CommandsModule.init(this.session);
                break;
            case 'tab-tracker':
                TrendsModule.init(this.session);
                break;
            case 'tab-stalker':
                StalkerModule.init(this.session);
                break;
            case 'tab-magic8':
                Magic8Module.init(this.session);
                break;
            case 'tab-roulette':
                RouletteModule.init(this.session);
                break;
            case 'tab-feedback':
                FeedbackModule.init(this.session);
                break;
        }
    },
};
