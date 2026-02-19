import{ProfileMessages as e}from"../i18n/profileMessages.js";import{UI as i}from"../../core/ui.js";const p={renderContent(a,s){const t=a.broadcaster_type==="partner"?e.partner:a.broadcaster_type==="affiliate"?e.affiliate:e.user,l=a.broadcaster_type?"var(--accent)":"var(--text-secondary)";return`
            <div class="profile-header">
                <img src="${a.profile_image_url||"img/LosPerris_progra.webp"}" class="profile-avatar-large" alt="${i.escapeHTML(a.display_name)}" loading="lazy">
                <div class="profile-title-group">
                    <h2 class="profile-name">${i.escapeHTML(a.display_name)}</h2>
                    <div class="profile-login">@${i.escapeHTML(a.login)}</div>
                </div>
            </div>

            <div class="profile-details-grid">
                <div class="detail-item">
                    <span class="detail-label">${e.labels.rank}</span>
                    <span class="detail-value" style="color: ${l}">${t}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${e.labels.userId}</span>
                    <span class="detail-value">${i.escapeHTML(a.id)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">${e.labels.age}</span>
                    <span class="detail-value">${s}</span>
                </div>
            </div>

            <div id="modal-bio" class="profile-bio">
                ${i.escapeHTML(a.description)||e.bioEmpty}
            </div>

            <div class="profile-footer">
                <div class="profile-created">${e.created(a.created_at)}</div>
                <button id="view-logs-btn" class="btn-secondary btn-full">
                    ${e.viewLogs}
                </button>
            </div>
        `},renderLogs(a){let s=`
            <div class="history-container">
                <h4 class="history-title">${e.historyTitle}</h4>
        `;return a.length===0?s+=`<div class="history-empty">${e.noHistory}</div>`:s+=`
                <div class="history-list">
                    ${a.map(t=>`
                        <div class="history-item">
                            <span class="history-time">[${t.time.toLocaleTimeString()}]</span>
                            <span class="history-text">${i.escapeHTML(t.text)}</span>
                        </div>
                    `).join("")}
                </div>
            `,s+="</div>",s}};export{p as ProfileTemplates};
