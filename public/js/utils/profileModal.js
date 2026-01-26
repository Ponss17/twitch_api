import { Messages } from './messages.js';
import { ProfileTemplates } from './profile/templates.js';
export const ProfileModal = {
    open(user) {
        const overlay = document.getElementById('profile-modal-overlay');
        const content = document.getElementById('profile-modal-content');
        if (!overlay || !content)
            return;
        const ageText = this.calculateAge(user.created_at);
        content.innerHTML = ProfileTemplates.renderContent(user, ageText);
        const logBtn = document.getElementById('view-logs-btn');
        if (logBtn) {
            logBtn.onclick = () => this.showUserLogs(user.login);
        }
        overlay.classList.add('active');
        const closeBtn = document.getElementById('close-modal-btn');
        if (closeBtn)
            closeBtn.onclick = () => this.close();
        overlay.onclick = (e) => { if (e.target === overlay)
            this.close(); };
    },
    close() {
        const overlay = document.getElementById('profile-modal-overlay');
        if (overlay)
            overlay.classList.remove('active');
    },
    calculateAge(dateStr) {
        const createdDate = new Date(dateStr);
        const now = new Date();
        const diffYears = now.getFullYear() - createdDate.getFullYear();
        const diffMonths = now.getMonth() - createdDate.getMonth();
        if (diffYears > 0)
            return Messages.Details.years(diffYears);
        if (diffMonths > 1)
            return Messages.Details.months(diffMonths);
        return Messages.Details.new;
    },
    async showUserLogs(login) {
        const bioEl = document.getElementById('modal-bio');
        if (bioEl) {
            bioEl.innerHTML = `<div class="loading-logs"><i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...</div>`;
        }
        const module = await import('../dashboard/trends.js');
        const logs = module.TrendsModule.getMessagesByUser(login);
        if (bioEl) {
            bioEl.innerHTML = ProfileTemplates.renderLogs(logs);
        }
    }
};
