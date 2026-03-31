import { UI } from '../../../core/ui.js';
import { Messages } from '../../../shared/i18n/messages.js';
import { StalkerMessages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS, IGNORED_BOTS } = DASHBOARD_CONFIG;
import { cache, CACHE_TTL } from '../../../services/cacheService.js';
import { TmiService, TmiTags } from '../../../services/tmiService.js';
import { StalkerTemplates } from './templates.js';
import { Session, StalkerUser, DashboardModule, TwitchUser } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';

interface IStalkerModule extends DashboardModule {
    isScanning: boolean;
    chatters: StalkerUser[];
    searchTimeout: ReturnType<typeof setTimeout> | null;
    isConnected: boolean;
    cssLoaded: boolean;
    uiInitialized: boolean;
    setupUI(): void;
    toggleScan(): void;
    connectTmi(): void;
    render(): void;
    loadChatters(): Promise<void>;
    renderTable(list: StalkerUser[]): void;
    filterChatters(query: string): void;
    inspectUser(login: string): Promise<void>;
}

export const StalkerModule: IStalkerModule = {
    ...BaseModule,
    session: null,
    isScanning: false,
    chatters: [] as StalkerUser[],
    searchTimeout: null as ReturnType<typeof setTimeout> | null,
    isConnected: false,
    initialized: false,
    cssLoaded: false,
    uiInitialized: false,

    init(session: Session): void {
        this.initBase(session, 'css/sections/stalker.css');
    },

    activate() {
        if (!this.uiInitialized) {
            this.render();
            this.setupUI();
            this.uiInitialized = true;
        }
    },

    setupUI() {
        const controls = document.getElementById('stalker-controls');
        if (controls && !controls.dataset.listener) {
            controls.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.id === 'stalker-search') {
                    if (this.searchTimeout) clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        this.filterChatters(target.value);
                    }, 300);
                }
            });

            controls.addEventListener('click', (e) => {
                const btn = (e.target as HTMLElement).closest('button');
                if (!btn) return;

                if (btn.id === 'toggle-stalker') this.toggleScan();
                if (btn.id === 'refresh-stalker') {
                    if (this.isScanning) {
                        this.loadChatters();
                        UI.showToast(StalkerMessages.updatedRaw, 'success', 'fa-check');
                    }
                }
            });
            controls.dataset.listener = 'true';
        }
    },

    toggleScan() {
        this.isScanning = !this.isScanning;
        const btn = document.getElementById('toggle-stalker');
        if (btn) {
            btn.className = this.isScanning ? 'btn-icon btn-warning' : 'btn-icon btn-success';
            btn.innerHTML = this.isScanning
                ? '<i class="fa-solid fa-pause"></i>'
                : '<i class="fa-solid fa-play"></i>';
        }

        const status = document.getElementById('stalker-status');
        if (status) {
            status.innerHTML = this.isScanning
                ? StalkerMessages.scanStarted
                : StalkerMessages.scanPaused;
            status.className = this.isScanning ? 'text-success' : 'text-muted-color';
        }

        if (this.isScanning) {
            UI.showToast(StalkerMessages.scanStartedRaw, 'success', 'fa-satellite-dish fa-beat');
            this.loadChatters();
            this.connectTmi();

            // Notificar al backend del uso de la herramienta
            fetch(`${API_ENDPOINTS.BASE}/dashboard/track-usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
                body: JSON.stringify({ tool: 'stalker' })
            }).catch((e) => console.warn('Error tracking stalker usage:', e));
        } else {
            UI.showToast(StalkerMessages.scanPausedRaw, 'warning', 'fa-snowflake');
            TmiService.disconnect();
            this.isConnected = false;
        }
    },

    connectTmi() {
        if (this.isConnected) return;
        if (!this.session) return;

        const auth = this.session.token
            ? {
                  username: this.session.login,
                  token: this.session.token
              }
            : undefined;

        TmiService.connect(this.session.login, auth)
            .then(() => {
                this.isConnected = true;
                TmiService.addListener(
                    'stalker',
                    (channel: string, tags: TmiTags, message: string) => {
                        if (!this.isScanning) return;

                        const login = tags.username;
                        if (!login) return;

                        if (IGNORED_BOTS.has(login.toLowerCase())) return;

                        import('../trends/module.js').then(({ TrendsModule }) => {
                            TrendsModule.messageLog.unshift({
                                user: login.toLowerCase(),
                                text: message,
                                time: new Date()
                            });
                            if (TrendsModule.messageLog.length > TrendsModule.MAX_LOG_SIZE)
                                TrendsModule.messageLog.pop();
                        });

                        if (
                            !this.chatters.some(
                                (u: StalkerUser) =>
                                    u.user_login.toLowerCase() === login.toLowerCase()
                            )
                        ) {
                            const newUser: StalkerUser = {
                                user_login: login,
                                user_name: tags['display-name'] || login,
                                profile_image_url: null
                            };
                            this.chatters.unshift(newUser);
                            this.renderTable(this.chatters);
                            (
                                document.getElementById('stalker-grid') as HTMLElement
                            )?.firstChild?.parentElement?.classList.add('row-highlight');
                        }
                    }
                );
            })
            .catch((err: unknown) => {
                console.error('Stalker TMI Error:', err);
                UI.showToast(
                    Messages.Common.connectionError || 'Error connecting to chat',
                    'error'
                );
                this.toggleScan();
            });
    },

    deactivate() {
        this.isScanning = false;
        TmiService.removeListener('stalker');
        TmiService.disconnect();
        this.isConnected = false;
    },

    render() {
        const container = document.getElementById('stalker-content');
        const controls = document.getElementById('stalker-controls');
        if (controls) controls.innerHTML = StalkerTemplates.renderControls(this.isScanning);
        if (container && container.innerHTML.trim() === '') {
            container.innerHTML = StalkerTemplates.renderMain();
        }

        const gridContainer = document.getElementById('stalker-grid');
        if (gridContainer && !gridContainer.dataset.listener) {
            gridContainer.onclick = (e) => {
                const row = (e.target as HTMLElement).closest('.stalker-row');
                if (row) {
                    const inspectBtn = row.querySelector('.inspect-btn') as HTMLElement;
                    const login = inspectBtn?.dataset.login;
                    if (login) this.inspectUser(login);
                }
            };
            gridContainer.dataset.listener = 'true';
        }
    },

    async loadChatters() {
        if (!this.isScanning) return;
        const tbody = document.getElementById('stalker-grid');
        const loading = document.getElementById('stalker-loading');
        if (!tbody) return;

        tbody.innerHTML = '';
        loading?.classList.add('hidden');
        tbody.appendChild(StalkerTemplates.renderRowsSkeleton(8));

        try {
            if (!this.session) return;
            const { login } = this.session;
            const res = await fetch(`${API_ENDPOINTS.CHATTERS}?channel=${login}`, {
                headers: this.authHeaders()
            });
            if (!res.ok)
                throw new Error(
                    res.status === 401 ? StalkerMessages.reloginMsg : StalkerMessages.apiError
                );

            const data = await res.json();
            const chattersList = Array.isArray(data) ? data : data.chatters || [];

            if (Array.isArray(chattersList)) {
                const apiChatters = (chattersList as (string | StalkerUser)[]).filter(
                    (item: string | StalkerUser) => {
                        const login = typeof item === 'string' ? item : item.user_login;
                        return login && !IGNORED_BOTS.has(login.toLowerCase());
                    }
                );

                const chatterMap = new Map<string, StalkerUser>();
                this.chatters.forEach((c: StalkerUser) =>
                    chatterMap.set(c.user_login.toLowerCase(), c)
                );

                apiChatters.forEach((item: string | StalkerUser) => {
                    const login = typeof item === 'string' ? item : item.user_login;
                    const name = typeof item === 'string' ? item : item.user_name;

                    if (login) {
                        const userObj: StalkerUser = {
                            user_login: login,
                            user_name: name || login,
                            profile_image_url:
                                typeof item === 'object' ? item.profile_image_url : null
                        };
                        chatterMap.set(login.toLowerCase(), userObj);
                    }
                });

                this.chatters = Array.from(chatterMap.values());
                this.renderTable(this.chatters);
                loading?.classList.add('hidden');
                if (this.chatters.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">${StalkerMessages.waiting}</div></td></tr>`;
                }
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error(error);
            loading?.classList.add('hidden');
            const safeMsg = UI.escapeHTML((error as Error).message);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px;">${safeMsg}</td></tr>`;
        }
    },

    renderTable(list: StalkerUser[]) {
        const tbody = document.getElementById('stalker-grid');
        if (!tbody) return;

        const fragment = document.createDocumentFragment();
        list.forEach((user) => {
            fragment.appendChild(
                StalkerTemplates.renderRow(user, Messages.Common.viewBtn, (l: string) =>
                    this.inspectUser(l)
                )
            );
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    },

    filterChatters(query: string) {
        const q = query.toLowerCase();
        this.renderTable(
            this.chatters.filter(
                (u: StalkerUser) =>
                    u.user_name.toLowerCase().includes(q) || u.user_login.toLowerCase().includes(q)
            )
        );
    },

    async inspectUser(login: string) {
        try {
            if (!this.session) return;
            const cacheKey = `user_info_${login}`;
            const cachedInfo = cache.get<TwitchUser>(cacheKey);

            if (cachedInfo) {
                import('../../../shared/utils/profileModal.js').then(({ ProfileModal }) =>
                    ProfileModal.open(cachedInfo)
                );
                return;
            }

            const res = await fetch(`${API_ENDPOINTS.USER_INFO}?login=${login}`, {
                headers: this.authHeaders()
            });
            if (!res.ok) throw new Error();
            const info = await res.json();

            cache.set(cacheKey, info, CACHE_TTL);

            import('../../../shared/utils/profileModal.js').then(({ ProfileModal }) =>
                ProfileModal.open(info)
            );
        } catch (_e) {
            UI.showToast(StalkerMessages.loadError, 'error');
        }
    }
};
