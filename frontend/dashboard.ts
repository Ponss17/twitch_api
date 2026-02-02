import { UI } from './ui.js';
import { HtmlLoader } from './utils/htmlLoader.js';
import { Session, DashboardModule } from './types.js';
import { Messages } from './utils/messages.js';

export const Dashboard = {
    session: null as Session | null,
    activeModules: [] as DashboardModule[],

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
            const safeDisplayName = UI.escapeHTML(displayName);
            const safeLogin = UI.escapeHTML(this.session.login);
            const welcomeMsg = Messages.Common.welcome(
                `<a href="https://twitch.tv/${safeLogin}" target="_blank" class="welcome-link">${safeDisplayName}</a>`
            );
            pageTitle.innerHTML = welcomeMsg;
        }

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            import('./auth.js').then((m) => m.Auth.logout());
        });
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.nav-item');
        tabs.forEach((tab) => {
            const htmlTab = tab as HTMLElement;
            htmlTab.addEventListener('click', () => {
                if (htmlTab.classList.contains('external-link')) return;

                tabs.forEach((t) => (t as HTMLElement).classList.remove('active'));
                htmlTab.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

                const tabId = htmlTab.dataset.tab!;
                const pane = document.getElementById(tabId);
                if (pane) pane.classList.add('active');

                this.activeModules.forEach((mod) => {
                    if (mod && typeof mod.deactivate === 'function') {
                        try {
                            mod.deactivate();
                        } catch (e) {
                            console.warn('Error deactivating module:', e);
                        }
                    }
                });
                this.activeModules = [];

                this.loadTab(tabId);
            });
        });
    },

    async loadTab(tabId: string) {
        if (!this.session) return;

        const container = document.getElementById(tabId);
        if (container && container.dataset.src) {
            await HtmlLoader.load(container.dataset.src, tabId);
        }

        const tabHandlers: Record<string, () => Promise<void>> = {
            'tab-home': async () => {
                const { AccountModule } = await import('./dashboard/account.js');
                const { AnalyticsModule } = await import('./dashboard/analytics.js');
                this.activeModules = [
                    AccountModule as DashboardModule,
                    AnalyticsModule as DashboardModule
                ];
                if (this.session) {
                    AccountModule.init(this.session);
                    AnalyticsModule.init(this.session);
                }
            },
            'tab-followage': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                this.activeModules = [CommandsModule];
                if (this.session) CommandsModule.init(this.session);
            },
            'tab-clips': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                const { ClipsModule } = await import('./dashboard/clips.js');
                this.activeModules = [ClipsModule, CommandsModule];
                if (this.session) {
                    ClipsModule.init(this.session);
                    CommandsModule.init(this.session);
                }
            },
            'tab-shoutout': async () => {
                const { CommandsModule } = await import('./dashboard/commands.js');
                this.activeModules = [CommandsModule];
                if (this.session) CommandsModule.init(this.session);
            },
            'tab-tracker': async () => {
                const { TrendsModule } = await import('./dashboard/trends.js');
                this.activeModules = [TrendsModule];
                if (this.session) TrendsModule.init(this.session);
            },
            'tab-stalker': async () => {
                const { StalkerModule } = await import('./dashboard/stalker.js');
                this.activeModules = [StalkerModule];
                if (this.session) StalkerModule.init(this.session);
            },
            'tab-magic8': async () => {
                const { Magic8Module } = await import('./dashboard/magic8.js');
                const { CommandsModule } = await import('./dashboard/commands.js');
                this.activeModules = [Magic8Module, CommandsModule];
                if (this.session) {
                    Magic8Module.init(this.session);
                    CommandsModule.init(this.session);
                }
            },
            'tab-roulette': async () => {
                const { RouletteModule } = await import('./dashboard/roulette.js');
                this.activeModules = [RouletteModule];
                if (this.session) RouletteModule.init(this.session);
            },
            'tab-feedback': async () => {
                const { FeedbackModule } = await import('./dashboard/feedback.js');
                this.activeModules = [FeedbackModule];
                if (this.session) FeedbackModule.init(this.session);
            }
        };

        if (tabHandlers[tabId]) {
            await tabHandlers[tabId]();
        }
    }
};
