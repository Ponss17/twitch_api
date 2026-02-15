import { ProfileMessages } from "../i18n/profileMessages.js";
import { UI } from "../../core/ui.js";
const ProfileTemplates = {
  renderContent(user, ageText) {
    const rankType = user.broadcaster_type === "partner" ? ProfileMessages.partner : user.broadcaster_type === "affiliate" ? ProfileMessages.affiliate : ProfileMessages.user;
    const rankColor = user.broadcaster_type ? "var(--accent)" : "var(--text-secondary)";
    return `
            <div class="profile-header">
                <img src="${user.profile_image_url || "img/LosPerris_progra.webp"}" class="profile-avatar-large" alt="${UI.escapeHTML(user.display_name)}" loading="lazy">
                <div class="profile-title-group">
                    <h2 class="profile-name">${UI.escapeHTML(user.display_name)}</h2>
                    <div class="profile-login">@${UI.escapeHTML(user.login)}</div>
                </div>
            </div>

            <div class="profile-details-grid">
                <div class="detail-item">
                    <span class="detail-label">${ProfileMessages.labels.rank}</span>
                    <span class="detail-value" style="color: ${rankColor}">${rankType}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${ProfileMessages.labels.userId}</span>
                    <span class="detail-value">${UI.escapeHTML(user.id)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${ProfileMessages.labels.age}</span>
                    <span class="detail-value">${ageText}</span>
                </div>
            </div>

            <div id="modal-bio" class="profile-bio">
                ${UI.escapeHTML(user.description) || ProfileMessages.bioEmpty}
            </div>

            <div class="profile-footer">
                <div class="profile-created">${ProfileMessages.created(user.created_at)}</div>
                <button id="view-logs-btn" class="btn-secondary btn-full">
                    ${ProfileMessages.viewLogs}
                </button>
            </div>
        `;
  },
  renderLogs(logs) {
    let html = `
            <div class="history-container">
                <h4 class="history-title">${ProfileMessages.historyTitle}</h4>
        `;
    if (logs.length === 0) {
      html += `<div class="history-empty">${ProfileMessages.noHistory}</div>`;
    } else {
      html += `
                <div class="history-list">
                    ${logs.map(
        (l) => `
                        <div class="history-item">
                            <span class="history-time">[${l.time.toLocaleTimeString()}]</span>
                            <span class="history-text">${UI.escapeHTML(l.text)}</span>
                        </div>
                    `
      ).join("")}
                </div>
            `;
    }
    html += `</div>`;
    return html;
  }
};
export {
  ProfileTemplates
};
