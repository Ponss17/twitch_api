import { Messages } from './messages.js';

export const ProfileModal = {
    open(user) {
        const overlay = document.getElementById('profile-modal-overlay');
        const avatar = document.getElementById('modal-avatar');
        const name = document.getElementById('modal-name');
        const modalLogin = document.getElementById('modal-login');
        const bio = document.getElementById('modal-bio');
        const created = document.getElementById('modal-created');

        const rank = document.getElementById('modal-rank');
        const userId = document.getElementById('modal-id');
        const accountAge = document.getElementById('modal-age');

        if (!overlay) return;

        avatar.src = user.profile_image_url || 'img/LosPerris_progra.webp';
        name.textContent = user.display_name;
        modalLogin.textContent = `@${user.login}`;
        bio.textContent = user.description || Messages.Stalker.bioEmpty;

        if (userId) userId.textContent = user.id;

        if (rank) {
            const types = { 'partner': Messages.Details.partner, 'affiliate': Messages.Details.affiliate };
            rank.textContent = types[user.broadcaster_type] || Messages.Details.user;
            rank.style.color = user.broadcaster_type ? 'var(--accent)' : 'var(--text-secondary)';
        }

        if (accountAge) {
            const createdDate = new Date(user.created_at);
            const now = new Date();
            const diffYears = now.getFullYear() - createdDate.getFullYear();
            const diffMonths = now.getMonth() - createdDate.getMonth();

            let ageText = '';
            if (diffYears > 0) {
                ageText = Messages.Details.years(diffYears);
            } else if (diffMonths > 1) {
                ageText = Messages.Details.months(diffMonths);
            } else {
                ageText = Messages.Details.new;
            }
            accountAge.textContent = ageText;
        }

        created.textContent = Messages.Details.created(user.created_at);

        const detailsGrid = document.querySelector('.profile-details-grid');
        let logBtn = document.getElementById('view-logs-btn');
        if (!logBtn && detailsGrid) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'detail-item';
            btnContainer.style.gridColumn = 'span 2';
            btnContainer.style.marginTop = '10px';
            btnContainer.innerHTML = `
                <button id="view-logs-btn" class="btn-secondary" style="width:100%; font-size:0.9rem;">
                    ${Messages.Details.viewLogs}
                </button>
             `;
            detailsGrid.appendChild(btnContainer);
            logBtn = btnContainer.querySelector('button');
        }

        if (logBtn) {
            logBtn.onclick = () => {
                this.showUserLogs(user.login, user.display_name);
            };
        }

        overlay.classList.add('active');

        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn) closeBtn.onclick = () => this.close();
        overlay.onclick = (e) => {
            if (e.target === overlay) this.close();
        };
    },

    close() {
        const overlay = document.getElementById('profile-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    showUserLogs(login, displayName) {
        import('../dashboard/trends.js').then(module => {
            const logs = module.TrendsModule.getMessagesByUser(login);
            const bio = document.getElementById('modal-bio');

            if (!bio) return;

            let html = `<div style="text-align:left; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; margin-top:10px;">
                <h4 style="margin:0 0 10px 0; font-size:0.9rem; color:var(--accent);">${Messages.Details.historyTitle}</h4>`;

            if (logs.length === 0) {
                html += `<div style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">${Messages.Details.noHistory}</div>`;
            } else {
                html += logs.map(l => `
                    <div style="font-size:0.85rem; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                        <span style="color:var(--text-muted); font-size:0.7rem;">[${l.time.toLocaleTimeString()}]</span>
                        <span style="color:var(--text-primary);">${l.text}</span>
                    </div>
                `).join('');
            }
            html += `</div>`;
            bio.innerHTML = html;
        });
    }
};
