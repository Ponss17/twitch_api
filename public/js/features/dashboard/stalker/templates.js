import{StalkerMessages as e}from"./messages.js";import{UI as c}from"../../../core/ui.js";const v={renderMain(){return`
            <div id="stalker-loading" class="loading-state hidden">
                <i class="fa-solid fa-spinner fa-spin"></i> ${e.rowsLoading}
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">${e.tableHeaders.avatar}</th>
                            <th>${e.tableHeaders.user}</th>
                            <th>${e.tableHeaders.login}</th>
                            <th style="text-align: right;">${e.tableHeaders.action}</th>
                        </tr>
                    </thead>
                    <tbody id="stalker-grid">
                        <tr>
                            <td colspan="4">
                                <div id="stalker-empty" class="empty-state">
                                    ${e.waiting}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                ${e.detectionNote}
            </div>
        `},renderControls(t){const s=t?"btn-warning":"btn-success",n=t?"fa-pause":"fa-play",a=t?e.scanControls.pause:e.scanControls.start;return`
            <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
                <input type="text" id="stalker-search" placeholder="${e.scanControls.searchPlaceholder}" class="stalker-search" aria-label="${e.scanControls.searchPlaceholder}">
            </div>
            <button id="toggle-stalker" class="btn-icon ${s} mr-5" title="${a}" aria-label="${a}">
                <i class="fa-solid ${n}" aria-hidden="true"></i>
            </button>
            <button id="refresh-stalker" class="btn-icon" title="${e.scanControls.refresh}" aria-label="${e.scanControls.refresh}">
                <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            </button>
        `},renderRow(t,s,n){const a=document.createElement("tr");a.className="stalker-row";const d=document.createElement("td"),p=c.escapeHTML(t.profile_image_url||""),h=c.escapeHTML(t.user_name);d.innerHTML=t.profile_image_url?`<img src="${p}" class="table-avatar-img" loading="lazy" alt="${h}">`:'<div class="table-avatar-empty"><i class="fa-solid fa-user"></i></div>';const l=document.createElement("td");l.className="word-text text-bold",l.textContent=t.user_name;const i=document.createElement("td");i.className="count-text text-muted-color",i.textContent=`@${t.user_login}`;const o=document.createElement("td");o.className="text-right";const r=document.createElement("button");return r.className="action-btn inspect-btn",r.dataset.login=t.user_login,r.innerHTML=s,r.onclick=m=>{m.stopPropagation(),n(t.user_login)},o.appendChild(r),a.appendChild(d),a.appendChild(l),a.appendChild(i),a.appendChild(o),a},renderRowsSkeleton(t=5){const s=document.createDocumentFragment();for(let n=0;n<t;n++){const a=document.createElement("tr");a.innerHTML=`
                <td><div class="skeleton skeleton-circle" style="width: 32px; height: 32px;"></div></td>
                <td><div class="skeleton" style="width: 100px; height: 16px;"></div></td>
                <td><div class="skeleton" style="width: 80px; height: 14px;"></div></td>
                <td class="text-right"><div class="skeleton" style="width: 60px; height: 28px; border-radius: 6px;"></div></td>
            `,s.appendChild(a)}return s}};export{v as StalkerTemplates};
//# sourceMappingURL=templates.js.map
