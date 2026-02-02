import { StalkerMessages } from './messages.js';
export const StalkerTemplates = {
    renderMain() {
        return `
            <div id="stalker-loading" class="loading-state hidden">
                <i class="fa-solid fa-spinner fa-spin"></i> ${StalkerMessages.rowsLoading}
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">${StalkerMessages.tableHeaders.avatar}</th>
                            <th>${StalkerMessages.tableHeaders.user}</th>
                            <th>${StalkerMessages.tableHeaders.login}</th>
                            <th style="text-align: right;">${StalkerMessages.tableHeaders.action}</th>
                        </tr>
                    </thead>
                    <tbody id="stalker-grid">
                        <tr>
                            <td colspan="4">
                                <div id="stalker-empty" class="empty-state">
                                    ${StalkerMessages.waiting}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                ${StalkerMessages.detectionNote}
            </div>
        `;
    },
    renderControls(isScanning) {
        const btnClass = isScanning ? 'btn-warning' : 'btn-success';
        const btnIcon = isScanning ? 'fa-pause' : 'fa-play';
        const btnTitle = isScanning ? StalkerMessages.scanControls.pause : StalkerMessages.scanControls.start;
        return `
            <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
                <input type="text" id="stalker-search" placeholder="${StalkerMessages.scanControls.searchPlaceholder}" class="stalker-search" aria-label="${StalkerMessages.scanControls.searchPlaceholder}">
            </div>
            <button id="toggle-stalker" class="btn-icon ${btnClass} mr-5" title="${btnTitle}" aria-label="${btnTitle}">
                <i class="fa-solid ${btnIcon}" aria-hidden="true"></i>
            </button>
            <button id="refresh-stalker" class="btn-icon" title="${StalkerMessages.scanControls.refresh}" aria-label="${StalkerMessages.scanControls.refresh}">
                <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            </button>
        `;
    },
    renderRow(user, viewBtnText, inspectFn) {
        const tr = document.createElement('tr');
        tr.className = 'stalker-row';
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
        btn.className = 'action-btn inspect-btn';
        btn.dataset.login = user.user_login;
        btn.innerHTML = viewBtnText;
        btn.onclick = (e) => {
            e.stopPropagation();
            inspectFn(user.user_login);
        };
        actionTd.appendChild(btn);
        tr.appendChild(avatarTd);
        tr.appendChild(nameTd);
        tr.appendChild(loginTd);
        tr.appendChild(actionTd);
        return tr;
    },
    renderRowsSkeleton(count = 5) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="skeleton skeleton-circle" style="width: 32px; height: 32px;"></div></td>
                <td><div class="skeleton" style="width: 100px; height: 16px;"></div></td>
                <td><div class="skeleton" style="width: 80px; height: 14px;"></div></td>
                <td class="text-right"><div class="skeleton" style="width: 60px; height: 28px; border-radius: 6px;"></div></td>
            `;
            fragment.appendChild(tr);
        }
        return fragment;
    }
};
