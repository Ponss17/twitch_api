import { Messages } from './utils/messages.js';
import { API_ENDPOINTS } from './utils/constants.js';
import { UI } from './ui.js';
import { HtmlLoader } from './utils/htmlLoader.js';

interface Session {
    login: string;
    displayName: string;
    profile_image_url: string;
    [key: string]: any;
}

export const Dashboard = {
    session: null as Session | null,

    init(session: Session) {
        this.session = session;
        this.setupTabs();
        this.setupUserBadge();
        this.loadTab('tab-home');
    },

    setupUserBadge() {
        if (!this.session) return;
        const { displayName, profile_image_url } = this.session;
        const avatar = document.getElementById('user-avatar') as HTMLImageElement;
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
        tabs.forEach((tab: any) => {
            tab.addEventListener('click', () => {
                if (tab.classList.contains('external-link')) return;

                tabs.forEach((t: any) => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const tabId = tab.dataset.tab!;
                document.getElementById(tabId)?.classList.add('active');

                this.loadTab(tabId);
            });
        });
    },

    async loadTab(tabId: string) {
        const container = document.getElementById(tabId);
        if (container && container.dataset.src) {
            await HtmlLoader.load(container.dataset.src, tabId);
        }

        const tabHandlers: Record<string, () => Promise<void>> = {
            'tab-home': async () => {
                const { AccountModule } = await import('./dashboard/account.js');
                const { AnalyticsModule } = await import('./dashboard/analytics.js');
                AccountModule.init(this.session);
                AnalyticsModule.init(this.session);
            },
            'tab-followage': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                CommandsModule.init(this.session);
            },
            'tab-clips': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                const { ClipsModule } = await import('./dashboard/clips.js');
                ClipsModule.init(this.session);
                CommandsModule.init(this.session);
            },
            'tab-shoutout': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                CommandsModule.init(this.session);
            },
            'tab-tracker': async () => {
                const { TrendsModule } = await import('./dashboard/trends.js');
                TrendsModule.init(this.session);
            },
            'tab-stalker': async () => {
                const { StalkerModule } = await import('./dashboard/stalker.js');
                StalkerModule.init(this.session);
            },
            'tab-magic8': async () => {
                const { Magic8Module } = await import('./dashboard/magic8.js');
                const { CommandsModule } = await import('./dashboard/commands.js');
                Magic8Module.init(this.session);
                CommandsModule.init(this.session);
            },
            'tab-roulette': async () => {
                const { RouletteModule } = await import('./dashboard/roulette.js');
                RouletteModule.init(this.session);
            },
            'tab-feedback': async () => {
                const { FeedbackModule } = await import('./dashboard/feedback.js');
                FeedbackModule.init(this.session);
            }
        };

        if (tabHandlers[tabId]) {
            await tabHandlers[tabId]();
        }
    },
};
