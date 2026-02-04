import { UI } from './ui.js';
import { HtmlLoader } from './utils/htmlLoader.js';
import { Session, DashboardModule } from './types.js';
import { Messages } from './utils/messages.js';

import { AccountModule } from './dashboard/account.js';
import { AnalyticsModule } from './dashboard/analytics.js';
import { CommandsModule } from './dashboard/commands.js';
import { ClipsModule } from './dashboard/clips.js';
import { TrendsModule } from './dashboard/trends.js';
import { StalkerModule } from './dashboard/stalker.js';
import { Magic8Module } from './dashboard/magic8.js';
import { RouletteModule } from './dashboard/roulette.js';
import { RussianModule } from './dashboard/russian/module.js';
import { FeedbackModule } from './dashboard/feedback.js';

export const Dashboard = {
    session: null as Session | null,
    activeModules: [] as DashboardModule[],

    async init(session: Session) {
        this.session = session;
        this.setupTabs();
        this.setupUserBadge();

        await this.preloadAllTabs();

        this.initAllModules();

        this.loadTab('tab-home');
    },

    async preloadAllTabs() {
        const panes = document.querySelectorAll('.tab-pane');
        const tasks = Array.from(panes).map((pane) => {
            const p = pane as HTMLElement;
            if (p.dataset.src) {
                return HtmlLoader.load(p.dataset.src, p.id);
            }
            return Promise.resolve();
        });
        await Promise.all(tasks);
    },

    initAllModules() {
        if (!this.session) return;
        const modules: DashboardModule[] = [
            AccountModule as DashboardModule,
            AnalyticsModule as DashboardModule,
            CommandsModule as DashboardModule,
            ClipsModule as DashboardModule,
            TrendsModule as DashboardModule,
            StalkerModule as DashboardModule,
            Magic8Module as DashboardModule,
            RouletteModule as DashboardModule,
            RussianModule as DashboardModule,
            FeedbackModule as DashboardModule
        ];
        modules.forEach((mod) => {
            if (mod && typeof mod.init === 'function') {
                try {
                    mod.init(this.session!);
                } catch (e) {
                    console.warn('Error initializing module:', e);
                }
            }
        });
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

                this.loadTab(tabId);
            });
        });
    },

    loadTab(tabId: string) {
        if (!this.session) return;

        this.activeModules.forEach((mod) => {
            if (mod && typeof mod.deactivate === 'function') {
                try {
                    mod.deactivate();
                } catch (error) {
                    console.error('Error al desactivar módulo:', error);
                }
            }
        });
        this.activeModules = [];

        const moduleMap: Record<string, DashboardModule[]> = {
            'tab-home': [AccountModule as DashboardModule, AnalyticsModule as DashboardModule],
            'tab-followage': [CommandsModule as DashboardModule],
            'tab-clips': [ClipsModule as DashboardModule, CommandsModule as DashboardModule],
            'tab-shoutout': [CommandsModule as DashboardModule],
            'tab-tracker': [TrendsModule as DashboardModule],
            'tab-stalker': [StalkerModule as DashboardModule],
            'tab-magic8': [Magic8Module as DashboardModule, CommandsModule as DashboardModule],
            'tab-roulette': [RouletteModule as DashboardModule],
            'tab-russian': [RussianModule as DashboardModule, CommandsModule as DashboardModule],
            'tab-feedback': [FeedbackModule as DashboardModule]
        };

        if (moduleMap[tabId]) {
            this.activeModules = moduleMap[tabId];
            this.activeModules.forEach((mod) => {
                if (mod && typeof mod.activate === 'function') {
                    mod.activate();
                }
            });
        }
    }
};
