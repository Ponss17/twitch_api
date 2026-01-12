import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';

export const StalkerModule = {
    session: null,
    chatters: [],

    init(session) {
        this.session = session;
        console.log('[StalkerModule] Table Init');

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

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">Avatar</th>
                            <th>Usuario</th>
                            <th>Login</th>
                            <th style="text-align: right;">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="stalker-grid">
                        <!-- Rows injected here -->
                    </tbody>
                </table>
            </div>
            
            <div id="stalker-empty" class="empty-state hidden">
                ${Messages.Stalker.empty}
            </div>
        `;
    },

    setupListeners() {
        const searchInput = document.getElementById('stalker-search');
        const refreshBtn = document.getElementById('refresh-stalker');
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
        const tbody = document.getElementById('stalker-grid');
        const loading = document.getElementById('stalker-loading');
        const empty = document.getElementById('stalker-empty');

        if (!tbody) return;

        tbody.innerHTML = '';
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

            this.renderTable(this.chatters);

            loading.classList.add('hidden');
            if (this.chatters.length === 0) empty.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            loading.classList.add('hidden');

            if (error.message.includes('re-login')) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#666;">${Messages.Stalker.reauthError} <button id="reauth-btn" class="btn-primary" style="margin-left:10px;">Re-Login</button></td></tr>`;
                document.getElementById('reauth-btn')?.addEventListener('click', () => {
                    window.location.href = 'auth/twitch';
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color: var(--text-secondary);"><i class="fa-solid fa-triangle-exclamation"></i> ${error.message}</td></tr>`;
            }
        }
    },

    renderTable(list) {
        const tbody = document.getElementById('stalker-grid');
        tbody.innerHTML = '';

        list.forEach(user => {
            const tr = document.createElement('tr');

            const avatarTd = document.createElement('td');
            avatarTd.innerHTML = user.profile_image_url
                ? `<img src="${user.profile_image_url}" class="table-avatar-img">`
                : `<div class="table-avatar-img" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-user"></i></div>`;

            const nameTd = document.createElement('td');
            nameTd.className = 'word-text';
            nameTd.style.fontWeight = '600';
            nameTd.textContent = user.user_name;

            const loginTd = document.createElement('td');
            loginTd.className = 'count-text';
            loginTd.style.color = 'var(--text-secondary)';
            loginTd.textContent = `@${user.user_login}`;

            const actionTd = document.createElement('td');
            actionTd.style.textAlign = 'right';

            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerHTML = '<i class="fa-solid fa-eye"></i> Ver';
            btn.onclick = () => this.inspectUser(user.user_login);

            actionTd.appendChild(btn);

            tr.appendChild(avatarTd);
            tr.appendChild(nameTd);
            tr.appendChild(loginTd);
            tr.appendChild(actionTd);

            tbody.appendChild(tr);
        });
    },

    filterChatters(query) {
        const q = query.toLowerCase();
        const filtered = this.chatters.filter(u =>
            u.user_name.toLowerCase().includes(q) ||
            u.user_login.toLowerCase().includes(q)
        );
        this.renderTable(filtered);
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
