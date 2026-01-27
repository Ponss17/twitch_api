import { UI } from '../../ui.js';
import { Messages } from '../../utils/messages.js';
import { API_ENDPOINTS } from '../../utils/constants.js';
import { CONFIG } from '../../config.js';
import { TmiService } from '../../utils/tmiService.js';
import { StalkerTemplates } from './templates.js';
export const StalkerModule = {
    session: null,
    isScanning: false,
    chatters: [],
    isConnected: false,
    init(session) {
        this.session = session;
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/stalker.css');
        });
        this.render();
        this.setupUI();
    },
    setupUI() {
        document.getElementById('stalker-search')?.addEventListener('input', (e) => this.filterChatters(e.target.value));
        document.getElementById('refresh-stalker')?.addEventListener('click', () => {
            if (this.isScanning) {
                this.loadChatters();
                UI.showToast(Messages.Stalker.updated);
            }
        });
        document.getElementById('toggle-stalker')?.addEventListener('click', () => this.toggleScan());
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            import('../../utils/profileModal.js').then(({ ProfileModal }) => ProfileModal.close());
        });
        const overlay = document.getElementById('profile-modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                import('../../utils/profileModal.js').then(({ ProfileModal }) => ProfileModal.close());
            }
        });
    },
    toggleScan() {
        this.isScanning = !this.isScanning;
        const btn = document.getElementById('toggle-stalker');
        if (btn) {
            btn.className = this.isScanning ? 'btn-icon btn-warning' : 'btn-icon btn-success';
            btn.innerHTML = this.isScanning ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        }
        const status = document.getElementById('stalker-status');
        if (status) {
            status.innerHTML = this.isScanning ? Messages.Stalker.scanStarted : Messages.Stalker.scanPaused;
            status.className = this.isScanning ? 'text-success' : 'text-muted-color';
        }
        if (this.isScanning) {
            UI.showToast(Messages.Stalker.scanStarted, 'success');
            this.loadChatters();
            this.connectTmi();
        }
        else {
            UI.showToast(Messages.Stalker.scanPaused, 'warning');
            TmiService.disconnect();
            this.isConnected = false;
        }
    },
    connectTmi() {
        if (this.isConnected)
            return;
        if (!this.session)
            return;
        const auth = this.session.token ? {
            username: this.session.login,
            token: this.session.token
        } : undefined;
        TmiService.connect(this.session.login, auth).then(() => {
            this.isConnected = true;
            TmiService.addListener('stalker', (channel, tags, message) => {
                if (!this.isScanning)
                    return;
                import('../trends/module.js').then(({ TrendsModule }) => {
                    if (tags.username) {
                        TrendsModule.messageLog.unshift({ user: tags.username, text: message, time: new Date() });
                        if (TrendsModule.messageLog.length > TrendsModule.MAX_LOG_SIZE)
                            TrendsModule.messageLog.pop();
                    }
                });
                const login = tags.username;
                if (CONFIG.IGNORED_BOTS.has(login.toLowerCase()))
                    return;
                if (!this.chatters.some((u) => u.user_login.toLowerCase() === login.toLowerCase())) {
                    const newUser = { user_login: login, user_name: tags['display-name'] || login, profile_image_url: null };
                    this.chatters.unshift(newUser);
                    this.renderTable(this.chatters);
                    document.getElementById('stalker-grid')?.firstChild?.parentElement?.classList.add('row-highlight');
                    document.getElementById('stalker-empty')?.classList.add('hidden');
                }
            });
        }).catch((err) => {
            console.error('Stalker TMI Error:', err);
            UI.showToast(Messages.Common.connectionError || 'Error connecting to chat', 'error');
            this.toggleScan();
        });
    },
    render() {
        const container = document.getElementById('stalker-content');
        const controls = document.getElementById('stalker-controls');
        if (controls)
            controls.innerHTML = StalkerTemplates.renderControls(this.isScanning);
        if (container && container.innerHTML.trim() === '') {
            container.innerHTML = StalkerTemplates.renderMain();
        }
    },
    async loadChatters() {
        if (!this.isScanning)
            return;
        const tbody = document.getElementById('stalker-grid');
        const loading = document.getElementById('stalker-loading');
        const empty = document.getElementById('stalker-empty');
        if (!tbody)
            return;
        tbody.innerHTML = '';
        loading?.classList.remove('hidden');
        empty?.classList.add('hidden');
        try {
            if (!this.session)
                return;
            const { apiKey, login } = this.session;
            const res = await fetch(`${API_ENDPOINTS.CHATTERS}?channel=${login}&apiKey=${apiKey}`);
            if (!res.ok)
                throw new Error(res.status === 401 ? Messages.Stalker.reloginMsg : Messages.Stalker.apiError);
            const data = await res.json();
            const chattersList = Array.isArray(data) ? data : (data.chatters || []);
            if (Array.isArray(chattersList)) {
                const apiChatters = chattersList.filter((item) => {
                    const login = typeof item === 'string' ? item : item.user_login;
                    return login && !CONFIG.IGNORED_BOTS.has(login.toLowerCase());
                });
                const chatterMap = new Map();
                this.chatters.forEach((c) => chatterMap.set(c.user_login.toLowerCase(), c));
                apiChatters.forEach((item) => {
                    const login = typeof item === 'string' ? item : item.user_login;
                    const name = typeof item === 'string' ? item : item.user_name;
                    if (login) {
                        const userObj = {
                            user_login: login,
                            user_name: name || login,
                            profile_image_url: typeof item === 'object' ? item.profile_image_url : null
                        };
                        chatterMap.set(login.toLowerCase(), userObj);
                    }
                });
                this.chatters = Array.from(chatterMap.values());
                this.renderTable(this.chatters);
                loading?.classList.add('hidden');
                if (this.chatters.length === 0)
                    empty?.classList.remove('hidden');
            }
            else {
                throw new Error('Invalid data format');
            }
        }
        catch (error) {
            console.error(error);
            loading?.classList.add('hidden');
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px;">${error.message}</td></tr>`;
        }
    },
    renderTable(list) {
        const tbody = document.getElementById('stalker-grid');
        if (!tbody)
            return;
        tbody.innerHTML = '';
        list.forEach(user => {
            tbody.appendChild(StalkerTemplates.renderRow(user, Messages.Common.viewBtn, (l) => this.inspectUser(l)));
        });
    },
    filterChatters(query) {
        const q = query.toLowerCase();
        this.renderTable(this.chatters.filter((u) => u.user_name.toLowerCase().includes(q) || u.user_login.toLowerCase().includes(q)));
    },
    async inspectUser(login) {
        try {
            if (!this.session)
                return;
            const res = await fetch(`${API_ENDPOINTS.USER_INFO}?login=${login}&apiKey=${this.session.apiKey}`);
            if (!res.ok)
                throw new Error();
            const info = await res.json();
            import('../../utils/profileModal.js').then(({ ProfileModal }) => ProfileModal.open(info));
        }
        catch (e) {
            UI.showToast(Messages.Stalker.loadError, 'error');
        }
    }
};
