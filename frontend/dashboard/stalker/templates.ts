import { StalkerUser } from '../../types.js';

export const StalkerTemplates = {
    renderMain() {
        return `
            <div id="stalker-loading" class="loading-state hidden">
                <i class="fa-solid fa-spinner fa-spin"></i> Cargando usuarios...
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
                Esperando actividad en el chat...
            </div>
            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                * La detección de usuarios se basa en la actividad reciente del chat.
            </div>
        `;
    },

    renderControls(isScanning: boolean) {
        const btnClass = isScanning ? 'btn-warning' : 'btn-success';
        const btnIcon = isScanning ? 'fa-pause' : 'fa-play';
        const btnTitle = isScanning ? 'Pausar Escaneo' : 'Iniciar Escaneo';

        return `
            <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input type="text" id="stalker-search" placeholder="Buscar usuario..." class="stalker-search">
            </div>
            <button id="toggle-stalker" class="btn-icon ${btnClass} mr-5" title="${btnTitle}">
                <i class="fa-solid ${btnIcon}"></i>
            </button>
            <button id="refresh-stalker" class="btn-icon" title="Recargar lista">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
        `;
    },

    renderRow(user: StalkerUser, viewBtnText: string, inspectFn: (login: string) => void) {
        const tr = document.createElement('tr');

        const avatarTd = document.createElement('td');
        avatarTd.innerHTML = user.profile_image_url
            ? `<img src="${user.profile_image_url}" class="table-avatar-img" loading="lazy" alt="${user.user_name}">`
            : `<div class="table-avatar-empty"><i class="fa-solid fa-user"></i></div>`;

        const nameTd = document.createElement('td');
        nameTd.className = 'word-text text-bold';
        nameTd.textContent = user.user_name;

        const loginTd = document.createElement('td');
        loginTd.className = 'count-text text-muted-color';
        loginTd.textContent = `@${user.user_login}`;

        const actionTd = document.createElement('td');
        actionTd.className = 'text-right';

        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.innerHTML = viewBtnText;
        btn.onclick = () => inspectFn(user.user_login);

        actionTd.appendChild(btn);
        tr.appendChild(avatarTd);
        tr.appendChild(nameTd);
        tr.appendChild(loginTd);
        tr.appendChild(actionTd);

        return tr;
    }
};
