import { ProfileMessages } from './profile/messages.js';
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
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.close();
            };
        }
        if (!overlay.dataset.listener) {
            overlay.onclick = (e) => {
                if (e.target === overlay)
                    this.close();
            };
            overlay.dataset.listener = 'true';
        }
        const modalCard = content.parentElement;
        if (modalCard) {
            modalCard.onclick = (e) => e.stopPropagation();
        }
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
            return ProfileMessages.years(diffYears);
        if (diffMonths > 1)
            return ProfileMessages.months(diffMonths);
        return ProfileMessages.new;
    },
    async showUserLogs(login) {
        const bioEl = document.getElementById('modal-bio');
        if (bioEl) {
            bioEl.innerHTML = `<div class="loading-logs"><i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...</div>`;
        }
        const module = await import('../dashboard/trends/module.js'); // Updated path if needed, check where trends module is relative to utils
        // Utils is in frontend/utils
        // Trends is in frontend/dashboard/trends/module.js
        // So path is ../dashboard/trends/module.js
        // Previous code had: '../dashboard/trends.js' (implying trends.js was in dashboard root?)
        // Let's check where trends module is.
        // It is in d:\zzzapi\twitch_api\frontend\dashboard\trends\module.ts
        // So previous import might have been wrong or relying on a re-export?
        // I created `trends/module.ts`.
        // The original code `import module = await import('../dashboard/trends.js');` suggests `frontend/dashboard/trends.ts` existed?
        // Let's check if `frontend/dashboard/trends.ts` exists.
        const logs = module.TrendsModule.getMessagesByUser(login);
        if (bioEl) {
            bioEl.innerHTML = ProfileTemplates.renderLogs(logs);
        }
    }
};
