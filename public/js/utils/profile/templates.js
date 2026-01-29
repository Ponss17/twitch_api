import { Messages } from '../messages.js';
import { UI } from '../../ui.js';
export const ProfileTemplates = {
    renderContent(user, ageText) {
        const rankType = user.broadcaster_type === 'partner'
            ? Messages.Details.partner
            : user.broadcaster_type === 'affiliate'
                ? Messages.Details.affiliate
                : Messages.Details.user;
        const rankColor = user.broadcaster_type ? 'var(--accent)' : 'var(--text-secondary)';
        return `
            <div class="profile-header">
                <img src="${user.profile_image_url || 'img/LosPerris_progra.webp'}" class="profile-avatar-large" alt="${UI.escapeHTML(user.display_name)}" loading="lazy">
                <div class="profile-title-group">
                    <h2 class="profile-name">${UI.escapeHTML(user.display_name)}</h2>
                    <div class="profile-login">@${UI.escapeHTML(user.login)}</div>
                </div>
            </div>

            <div class="profile-details-grid">
                <div class="detail-item">
                    <span class="detail-label">Rango</span>
                    <span class="detail-value" style="color: ${rankColor}">${rankType}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ID de Usuario</span>
                    <span class="detail-value">${UI.escapeHTML(user.id)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Antigüedad</span>
                    <span class="detail-value">${ageText}</span>
                </div>
            </div>

            <div id="modal-bio" class="profile-bio">
                ${UI.escapeHTML(user.description) || Messages.Stalker.bioEmpty}
            </div>

            <div class="profile-footer">
                <div class="profile-created">${Messages.Details.created(user.created_at)}</div>
                <button id="view-logs-btn" class="btn-secondary btn-full">
                    ${Messages.Details.viewLogs}
                </button>
            </div>
        `;
    },
    renderLogs(logs) {
        let html = `
            <div class="history-container">
                <h4 class="history-title">${Messages.Details.historyTitle}</h4>
        `;
        if (logs.length === 0) {
            html += `<div class="history-empty">${Messages.Details.noHistory}</div>`;
        }
        else {
            html += `
                <div class="history-list">
                    ${logs
                .map((l) => `
                        <div class="history-item">
                            <span class="history-time">[${l.time.toLocaleTimeString()}]</span>
                            <span class="history-text">${UI.escapeHTML(l.text)}</span>
                        </div>
                    `)
                .join('')}
                </div>
            `;
        }
        html += `</div>`;
        return html;
    }
};
