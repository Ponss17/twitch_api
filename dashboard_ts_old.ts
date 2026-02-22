import { HtmlLoader } from '../shared/utils/htmlLoader.js';
import { Session, DashboardModule } from '../types.js';

import { HomeModule } from '../features/dashboard/home.js';
import { CommandsModule } from '../features/dashboard/commands.js';
import { ClipsModule } from '../features/dashboard/clips.js';
import { TrendsModule } from '../features/dashboard/trends.js';
import { StalkerModule } from '../features/dashboard/stalker.js';
import { Magic8Module } from '../features/dashboard/magic8.js';
import { RouletteModule } from '../features/dashboard/roulette.js';
import { RussianModule } from '../features/dashboard/russian/module.js';
import { DuelModule } from '../features/dashboard/duel/module.js';
import { ProfileModule } from './profile.js';
import { FeedbackModule } from '../features/dashboard/feedback.js';

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
            if (pane instanceof HTMLElement && pane.dataset.src) {
                return HtmlLoader.load(pane.dataset.src, pane.id);
            }
            return Promise.resolve();
        });
        await Promise.all(tasks);
    },

    initAllModules() {
        if (!this.session) return;
        const modules: DashboardModule[] = [
            HomeModule,
            ProfileModule,
            CommandsModule,
            ClipsModule,
            TrendsModule,
            StalkerModule,
            Magic8Module,
            RouletteModule,
            RussianModule,
            DuelModule,
            FeedbackModule
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
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-display-name');

        if (avatar instanceof HTMLImageElement && profile_image_url) {
            avatar.src = profile_image_url;
            avatar.style.display = 'block';
        }
        if (name && displayName) {
            name.innerText = displayName;
        }

        const toggle = document.getElementById('user-dropdown-toggle');
        const container = document.querySelector('.user-dropdown-container');
        const menu = document.getElementById('user-menu');

        if (toggle && container && menu) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!container.contains(e.target as Node)) {
                    container.classList.remove('active');
                }
            });

            const profileBtn = document.getElementById('btn-profile');
            if (profileBtn) {
                profileBtn.addEventListener('click', () => {
                    container.classList.remove('active');

                    document
                        .querySelectorAll('.tab-pane')
                        .forEach((p) => p.classList.remove('active'));
                    const pane = document.getElementById('tab-profile');
                    if (pane) pane.classList.add('active');

                    this.loadTab('tab-profile');
                    document
                        .querySelectorAll('.nav-item')
                        .forEach((t) => t.classList.remove('active'));
                });
            }

            document.getElementById('logout-btn-header')?.addEventListener('click', () => {
                import('./auth.js').then((m) => m.Auth.logout());
            });
        }

        this.updatePageTitle('tab-home');

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            import('./auth.js').then((m) => m.Auth.logout());
        });
    },

    updatePageTitle(tabId: string) {
        const pageTitle = document.getElementById('page-title');
        if (!pageTitle) return;

        const titleMap: Record<string, string> = {
            'tab-home': 'Inicio',
            'tab-profile': 'Mi Perfil',
            'tab-followage': 'Followage',
            'tab-clips': 'Clips',
            'tab-shoutout': 'Shoutout',
            'tab-tracker': 'Tendencias',
            'tab-stalker': 'Stalker',
            'tab-magic8': 'Bola 8 Mágica',
            'tab-roulette': 'Ruleta',
            'tab-russian': 'Ruleta Rusa',
            'tab-duel': 'Duelo',
            'tab-feedback': 'Feedback'
        };

        const title = titleMap[tabId] || 'Dashboard';

        pageTitle.textContent = title;
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

        this.updatePageTitle(tabId);

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
            'tab-home': [HomeModule as DashboardModule],
            'tab-profile': [ProfileModule as DashboardModule],
            'tab-followage': [CommandsModule as DashboardModule],
            'tab-clips': [ClipsModule as DashboardModule, CommandsModule as DashboardModule],
            'tab-shoutout': [CommandsModule as DashboardModule],
            'tab-tracker': [TrendsModule as DashboardModule],
            'tab-stalker': [StalkerModule as DashboardModule],
            'tab-magic8': [Magic8Module as DashboardModule, CommandsModule as DashboardModule],
            'tab-roulette': [RouletteModule as DashboardModule],
            'tab-russian': [RussianModule as DashboardModule, CommandsModule as DashboardModule],
            'tab-duel': [DuelModule as DashboardModule, CommandsModule as DashboardModule],
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
