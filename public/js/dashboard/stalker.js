import { Loader } from '../utils/loader.js';
import { UI } from '../ui.js';
import { Messages } from '../utils/messages.js';

export const StalkerModule = {
    session: null,
    isScanning: false,

    init(session) {
        this.session = session;
        Loader.loadCSS('./css/sections/stalker.css').then(() => {
            this.render();
            this.setupListeners();
        });
    },

    client: null,

    connectTmi() {
        if (typeof window.tmi === 'undefined') return;

        import('../utils/tmiService.js').then(({ TmiService }) => {
            TmiService.init(this.session.login);

            TmiService.addMessageListener((channel, tags, message) => {
                if (!this.isScanning) return;

                const login = tags.username;
                const name = tags['display-name'] || login;

                const ignored = new Set(['nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker', 'botrixoficial', 'trackerggbot']);
                if (ignored.has(login.toLowerCase())) return;

                const exists = this.chatters.some(u => u.user_login.toLowerCase() === login.toLowerCase());

                if (!exists) {
                    const newUser = {
                        user_login: login,
                        user_name: name,
                        profile_image_url: null
                    };

                    this.chatters.unshift(newUser);
                    this.renderTable(this.chatters);

                    const tbody = document.getElementById('stalker-grid');
                    if (tbody && tbody.firstChild) {
                        const row = tbody.firstChild;
                        row.style.background = "rgba(59, 130, 246, 0.2)";
                        row.style.transition = "background 1s";
                        setTimeout(() => row.style.background = "", 1000);
                    }

                    const empty = document.getElementById('stalker-empty');
                    if (empty) empty.classList.add('hidden');
                }
            });
        });
    },

    toggleScan() {
        this.isScanning = !this.isScanning;
        this.render();

        if (this.isScanning) {
            this.loadChatters();
            this.connectTmi();
        } else {
            this.chatters = [];
            this.renderTable(this.chatters);
        }
    },

    render() {
        const container = document.getElementById('stalker-content');
        const controls = document.getElementById('stalker-controls');

        if (controls) {
            const btnClass = this.isScanning ? 'btn-warning' : 'btn-success';
            const btnIcon = this.isScanning ? 'fa-pause' : 'fa-play';
            const btnTitle = this.isScanning ? 'Pausar Escaneo' : 'Iniciar Escaneo';

            controls.innerHTML = `
                <div class="search-wrapper">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="stalker-search" placeholder="Buscar usuario..." class="stalker-search">
                </div>
                <button id="toggle-stalker" class="btn-icon ${btnClass}" title="${btnTitle}" style="margin-right:5px;">
                    <i class="fa-solid ${btnIcon}"></i>
                </button>
                <button id="refresh-stalker" class="btn-icon" title="Recargar lista">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            `;
        }

        if (!container) return;

        if (container.innerHTML.trim() === '') {
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
            
            <div id="stalker-empty" class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
                <h3>Esperando señal...</h3>
                <p>Dale al botón <strong>Play</strong> para comenzar a escanear el chat.</p>
            </div>
            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                * Lista sincronizada con API + Chat en vivo
            </div>
        `;
        } else {
            const empty = document.getElementById('stalker-empty');
            const grid = document.getElementById('stalker-grid');

            if (empty && grid) {
                if (!this.isScanning && this.chatters.length === 0) {
                    empty.classList.remove('hidden');
                    empty.innerHTML = `
                        <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
                        <h3>Esperando señal...</h3>
                        <p>Dale al botón <strong>Play</strong> para comenzar a escanear el chat.</p>
                    `;
                } else if (this.chatters.length === 0 && this.isScanning) {
                    empty.classList.remove('hidden');
                    empty.innerHTML = `${Messages.Stalker.empty}`;
                }
            }
        }
    },

    setupListeners() {
        const searchInput = document.getElementById('stalker-search');
        const refreshBtn = document.getElementById('refresh-stalker');
        const toggleBtn = document.getElementById('toggle-stalker');
        const closeBtn = document.getElementById('close-modal-btn');
        const overlay = document.getElementById('profile-modal-overlay');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterChatters(e.target.value));
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.isScanning) {
                    this.loadChatters();
                    UI.showToast(Messages.Stalker.updated);
                }
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleScan());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                import('../utils/profileModal.js').then(({ ProfileModal }) => ProfileModal.close());
            });
        }
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    import('../utils/profileModal.js').then(({ ProfileModal }) => ProfileModal.close());
                }
            });
        }
    },

    async loadChatters() {
        if (!this.isScanning) return;
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
                if (res.status === 401) throw new Error(Messages.Stalker.reloginMsg);
                throw new Error(Messages.Stalker.apiError);
            }

            const data = await res.json();
            const ignored = new Set(['nightbot', 'streamelements', 'fossabot', 'moobot', 'wizebot', 'soundalert', 'rainmaker', 'botrixoficial', 'trackerggbot']);
            const apiChatters = data.filter(u => !ignored.has(u.user_login.toLowerCase()));
            const chatterMap = new Map();
            this.chatters.forEach(c => chatterMap.set(c.user_login.toLowerCase(), c));
            apiChatters.forEach(c => chatterMap.set(c.user_login.toLowerCase(), c));

            this.chatters = Array.from(chatterMap.values());

            this.renderTable(this.chatters);

            loading.classList.add('hidden');
            if (this.chatters.length === 0) empty.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            loading.classList.add('hidden');

            if (error.message.includes('re-login')) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#666;">${Messages.Stalker.reauthError} <button id="reauth-btn" class="btn-primary" style="margin-left:10px;">Re-Login</button></td></tr>`;
                document.getElementById('reauth-btn')?.addEventListener('click', () => {
                    import('../auth.js').then(m => m.Auth.relogin());
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color: var(--text-secondary);"><i class="fa-solid fa-triangle-exclamation"></i> ${error.message}</td></tr>`;
            }
        }
    },

    renderTable(list) {
        const tbody = document.getElementById('stalker-grid');
        if (!tbody) return;
        tbody.innerHTML = '';

        list.forEach(user => {
            const tr = document.createElement('tr');

            const avatarTd = document.createElement('td');
            avatarTd.innerHTML = user.profile_image_url
                ? `<img src="${user.profile_image_url}" class="table-avatar-img">`
                : `<div class="table-avatar-img" style="background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i class="fa-solid fa-user"></i></div>`;

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
            if (!res.ok) throw new Error(Messages.Stalker.infoError);
            const info = await res.json();

            import('../utils/profileModal.js').then(({ ProfileModal }) => {
                ProfileModal.open(info);
            });

        } catch (e) {
            console.error(e);
            alert(Messages.Stalker.loadError);
        }
    }
};
