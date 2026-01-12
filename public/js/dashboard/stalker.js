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
        const controls = document.getElementById('stalker-controls');

        if (controls) {
            controls.innerHTML = `
                <div class="search-wrapper">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="stalker-search" placeholder="Buscar usuario..." class="stalker-search">
                </div>
                <button id="refresh-stalker" class="btn-icon" title="Recargar lista">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            `;
        }

        if (!container) return;

        container.innerHTML = `
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

        // Modal Listeners
        const closeBtn = document.getElementById('close-modal-btn');
        const overlay = document.getElementById('profile-modal-overlay');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterChatters(e.target.value));
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadChatters());
        }

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
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

            this.openModal(info);
        } catch (e) {
            console.error(e);
            alert(Messages.Stalker.loadError);
        }
    },

    openModal(user) {
        const overlay = document.getElementById('profile-modal-overlay');
        const avatar = document.getElementById('modal-avatar');
        const name = document.getElementById('modal-name');
        const modalLogin = document.getElementById('modal-login');
        const views = document.getElementById('modal-views');
        const bio = document.getElementById('modal-bio');
        const created = document.getElementById('modal-created');

        if (!overlay) return;

        avatar.src = user.profile_image_url || 'img/LosPerris_progra.webp';
        name.textContent = user.display_name;
        modalLogin.textContent = `@${user.login}`;
        views.textContent = user.view_count ? user.view_count.toLocaleString() : '0';
        bio.textContent = user.description || 'Sin biografía.';
        created.textContent = `Creado: ${new Date(user.created_at).toLocaleDateString()}`;

        overlay.classList.add('active');
    },

    closeModal() {
        const overlay = document.getElementById('profile-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    }
};
