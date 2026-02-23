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

        this.initAllModules();

        await this.loadTab('tab-home');

        setTimeout(() => {
            this.preloadAllTabsBackground();
        }, 1000);
    },

    preloadAllTabsBackground() {
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach((pane) => {
            if (pane instanceof HTMLElement && pane.dataset.src && pane.id !== 'tab-home') {
                HtmlLoader.load(pane.dataset.src, pane.id).catch(console.error);
            }
        });
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
            'tab-home': '<i class="fa-solid fa-house"></i> Inicio',
            'tab-profile': '<i class="fa-solid fa-user"></i> Mi Perfil',
            'tab-followage': '<i class="fa-solid fa-clock-rotate-left"></i> Followage',
            'tab-clips': '<i class="fa-solid fa-film"></i> Clips',
            'tab-shoutout': '<i class="fa-solid fa-bullhorn"></i> Shoutout',
            'tab-tracker': '<i class="fa-solid fa-chart-line"></i> Tendencias',
            'tab-stalker': '<i class="fa-solid fa-users-viewfinder"></i> Stalker',
            'tab-magic8': '<i class="fa-solid fa-8"></i> Bola 8 Mágica',
            'tab-roulette': '<i class="fa-solid fa-dice"></i> Ruleta',
            'tab-russian': '<i class="fa-solid fa-skull-crossbones"></i> Ruleta Rusa',
            'tab-duel': '<i class="fa-solid fa-khanda"></i> Duelo',
            'tab-feedback': '<i class="fa-solid fa-comment-dots"></i> Feedback'
        };

        const title = titleMap[tabId] || '<i class="fa-solid fa-gauge"></i> Dashboard';
        pageTitle.innerHTML = title;
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.nav-item');
        tabs.forEach((tab) => {
            const htmlTab = tab as HTMLElement;
            htmlTab.addEventListener('click', async () => {
                if (htmlTab.classList.contains('external-link')) return;

                tabs.forEach((t) => (t as HTMLElement).classList.remove('active'));
                htmlTab.classList.add('active');
                document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

                const tabId = htmlTab.dataset.tab!;
                const pane = document.getElementById(tabId);
                if (pane) pane.classList.add('active');

                await this.loadTab(tabId);
            });
        });
    },

    async loadTab(tabId: string) {
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

        const pane = document.getElementById(tabId);
        if (pane && pane.dataset.src) {
            try {
                await HtmlLoader.load(pane.dataset.src, pane.id);
            } catch (error) {
                console.error(`Error loading HTML for tab ${tabId}:`, error);
            }
        }

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
