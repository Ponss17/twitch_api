import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';

export const StalkerModule = {
    session: null,
    chatters: [],

    init(session) {
        this.session = session;
        console.log('[StalkerModule] Init');

        Loader.loadCSS('./css/sections/stalker.css').then(() => {
            this.render();
            this.loadChatters();
            this.setupListeners();
        });
    },

    render() {
        const container = document.getElementById('stalker-content');
        if (!container) return;

        container.innerHTML = `
            <div class="stalker-header">
                <div class="search-wrapper">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="stalker-search" placeholder="Buscar usuario..." class="stalker-search">
                </div>
                <button id="refresh-stalker" class="btn-icon">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
            
            <div id="stalker-loading" class="loading-state hidden">
                ${Messages.Stalker.loading}
            </div>

            <div id="stalker-grid" class="stalker-grid"></div>
            
            <div id="stalker-empty" class="empty-state hidden">
                ${Messages.Stalker.empty}
            </div>
        `;
    },

    setupListeners() {
        const searchInput = document.getElementById('stalker-search');
        const refreshBtn = document.getElementById('refresh-stalker');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterChatters(e.target.value));
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadChatters());
        }
    },

    async loadChatters() {
        const grid = document.getElementById('stalker-grid');
        const loading = document.getElementById('stalker-loading');
        const empty = document.getElementById('stalker-empty');

        if (!grid) return;

        grid.innerHTML = '';
        loading.classList.remove('hidden');
        empty.classList.add('hidden');

        try {
            const { apiKey, login } = this.session;
            const res = await fetch(`api/chatters?channel=${login}&apiKey=${apiKey}`);

            if (!res.ok) {
                if (res.status === 401) throw new Error('Necesitas re-login (Permisos)');
                throw new Error('Error API');
            }

            const data = await res.json();
            this.chatters = data;

            this.renderGrid(this.chatters);

            loading.classList.add('hidden');
            if (this.chatters.length === 0) empty.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            loading.classList.add('hidden');

            if (error.message.includes('re-login')) {
                grid.innerHTML = Messages.Stalker.reauthError;
                document.getElementById('reauth-btn').addEventListener('click', () => {
                    window.location.href = 'auth/twitch';
                });
            } else {
                grid.innerHTML = Messages.Common.error(error.message);
            }
        }
    },

    renderGrid(list) {
        const grid = document.getElementById('stalker-grid');
        grid.innerHTML = '';

        list.forEach(user => {
            const card = document.createElement('div');
            card.className = 'stalker-card';

            card.innerHTML = `
                <div class="stalker-avatar">
                   <i class="fa-solid fa-user"></i>
                </div>
                <div class="stalker-info">
                    <div class="stalker-name">${user.user_name}</div>
                    <div class="stalker-login">@${user.user_login}</div>
                </div>
            `;

            card.addEventListener('click', () => this.inspectUser(user.user_login));
            grid.appendChild(card);
        });
    },

    filterChatters(query) {
        const q = query.toLowerCase();
        const filtered = this.chatters.filter(u =>
            u.user_name.toLowerCase().includes(q) ||
            u.user_login.toLowerCase().includes(q)
        );
        this.renderGrid(filtered);
    },

    async inspectUser(login) {
        const { apiKey } = this.session;
        try {
            const res = await fetch(`api/user-info?login=${login}&apiKey=${apiKey}`);
            if (!res.ok) throw new Error('Error info');
            const info = await res.json();

            alert(Messages.Stalker.userInfo(info));
        } catch (e) {
            alert(Messages.Stalker.loadError);
        }
    }
};
