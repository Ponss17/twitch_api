var p=Object.defineProperty;var n=(e,s)=>p(e,"name",{value:s,configurable:!0});import{fetchAdmin as i,logout as v,checkAuth as y}from"./auth.js";let d=null,f="overview";window.switchSection=e=>{f=e,document.querySelectorAll(".admin-section").forEach(r=>r.classList.remove("active")),document.querySelectorAll(".nav-item").forEach(r=>r.classList.remove("active")),document.getElementById(`section-${e}`)?.classList.add("active");const s=document.querySelector(`button[onclick*="switchSection('${e}')"]`);s&&s.classList.add("active");const t={overview:"Resumen General",users:"Gesti\xF3n de Usuarios",system:"Salud del Sistema",limits:"L\xEDmites & Tr\xE1fico",logs:"Logs del Sistema",security:"Seguridad & Admins",config:"Configuraci\xF3n"},a=document.getElementById("current-section-title");a&&(a.textContent=t[e]||"Panel Admin"),e==="overview"?(h(),l()):e==="users"?l():e==="system"?$():e==="config"?k():e==="security"?u():e==="logs"&&window.refreshLogs()},window.refreshLogs=async()=>{const e=document.getElementById("logs-list");if(e)try{const t=await(await i("/api/twitch/admin/logs")).json();if(!t.length){e.innerHTML='<div class="loading-cell">No hay logs registrados todav\xEDa.</div>';return}e.innerHTML=t.map(a=>`
            <div class="log-item level-${a.level}">
                <span class="log-time">${new Date(a.timestamp).toLocaleTimeString()}</span>
                <span class="log-level ${a.level}">${a.level}</span>
                <span class="log-message">${a.message}${a.details?` <small style="opacity:0.5">(${JSON.stringify(a.details)})</small>`:""}</span>
            </div>
        `).join(""),e.scrollTop=0}catch{o("Error","Error al cargar logs","error")}};const w=n(e=>{const s=document.getElementById("usersChart");if(!s)return;d&&d.destroy();const t=e.map(r=>r.displayName),a=e.map(r=>r.totalRequests||0);d=new Chart(s,{type:"bar",data:{labels:t,datasets:[{label:"Total Requests",data:a,backgroundColor:"rgba(145, 70, 255, 0.5)",borderColor:"rgba(145, 70, 255, 1)",borderWidth:1}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{y:{beginAtZero:!0,grid:{color:"rgba(255, 255, 255, 0.1)"},ticks:{color:"#efeff1"}},x:{grid:{display:!1},ticks:{color:"#efeff1"}}},plugins:{legend:{labels:{color:"#efeff1"}}}}})},"renderChart"),m=n(e=>{const s=document.getElementById("users-table-body");if(s){if(e.length===0){s.innerHTML='<tr><td colspan="6" class="loading-cell">No se encontraron usuarios.</td></tr>';return}s.innerHTML=e.map(t=>`
        <tr class="${t.isActive===!1?"blocked":""}">
            <td>
                <div class="user-info">
                    <img src="${t.profileImageUrl||"https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png"}" alt="${t.displayName}" class="avatar">
                    <div class="details">
                        <span class="name">${t.displayName}</span>
                        <span class="login">(${t.login})</span>
                        <br>
                        <small class="meta">Creado: ${t.createdAt?new Date(t.createdAt).toLocaleDateString():"Desconocido"}</small>
                    </div>
                </div>
            </td>
            <td>
                <code class="api-key">${t.apiKey}</code>
                <button class="btn-icon" onclick="window.resetKey('${t.userId}')" title="Reset Key">
                    <i class="fa-solid fa-rotate"></i>
                </button>
            </td>
            <td class="stats-cell">
                <div>Reqs: <strong>${t.totalRequests||0}</strong></div>
                <small>\xDAltima vez: ${t.lastActive?new Date(t.lastActive).toLocaleString():"Sin actividad"}</small>
            </td>
            <td>
                <div class="rate-limit-cell">
                    <span class="rate-value">${t.customRateLimit||"120"}</span>
                    <button class="btn-icon-alt" onclick="window.updateRateLimit('${t.userId}', ${t.customRateLimit||120})" title="Editar L\xEDmite">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            </td>
            <td>
                <span class="status-badge ${t.isActive!==!1?"active":"inactive"}">
                    ${t.isActive!==!1?"Activo":"Bloqueado"}
                </span>
                ${t.blockedReason?`<br><small class="reason">${t.blockedReason}</small>`:""}
            </td>
            <td class="actions-cell">
                ${t.isActive!==!1?`<button class="btn-block" onclick="window.blockUser('${t.userId}')">
                               <i class="fa-solid fa-ban"></i> Bloquear
                           </button>`:`<button class="btn-unblock" onclick="window.unblockUser('${t.userId}')">
                               <i class="fa-solid fa-check"></i> Desbloquear
                           </button>`}
                <button class="btn-delete" onclick="window.deleteUser('${t.userId}')" title="Eliminar Usuario">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join("")}},"renderUsers"),b=n(()=>{let e=document.getElementById("toast-container");return e||(e=document.createElement("div"),e.id="toast-container",e.className="toast-container",document.body.appendChild(e)),e},"createToastContainer"),o=n((e,s,t="info")=>{const a=b(),r=document.createElement("div");r.className=`toast ${t}`;const c=t==="success"?"fa-circle-check":t==="error"?"fa-circle-exclamation":"fa-circle-info";r.innerHTML=`
        <i class="fa-solid ${c} toast-icon"></i>
        <div class="toast-content">
            <span class="toast-title">${e}</span>
            <span class="toast-message">${s}</span>
        </div>
    `,a.appendChild(r),requestAnimationFrame(()=>{r.classList.add("show")}),setTimeout(()=>{r.classList.remove("show"),setTimeout(()=>r.remove(),300)},4e3)},"showToast");let g=[];const E=n(()=>{const e=document.getElementById("user-search");e&&e.addEventListener("input",s=>{const t=s.target.value.toLowerCase(),a=g.filter(r=>r.displayName.toLowerCase().includes(t)||r.login.toLowerCase().includes(t)||r.userId.includes(t));m(a)})},"setupSearch"),l=n(async()=>{try{const e=await i("/api/twitch/admin/users");if(!e.ok)throw new Error(`Failed to load users: ${e.status}`);const s=await e.json();g=s,m(s),w(s)}catch(e){console.error("Error in loadUsers:",e),o("Error","Error cargando usuarios","error")}},"loadUsers"),h=n(async()=>{try{const e=await i("/api/twitch/admin/stats/global");if(!e.ok)throw new Error("Failed to load global stats");const s=await e.json(),t=document.getElementById("kpi-total-users"),a=document.getElementById("kpi-total-requests"),r=document.getElementById("kpi-active-users");t&&(t.innerText=s.totalUsers),a&&(a.innerText=s.totalRequests),r&&(r.innerText=s.activeUsers)}catch(e){console.error("Error loadGlobalStats:",e)}},"loadGlobalStats"),$=n(async()=>{const e=document.getElementById("system-status-container");if(e)try{const s=await i("/api/twitch/admin/system/status");if(!s.ok)throw new Error("Failed to load system status");const t=await s.json();e.innerHTML=Object.entries(t.services).map(([a,r])=>`
            <div class="status-item">
                <div class="status-info">
                    <div class="status-indicator ${r.status}"></div>
                    <div>
                        <div style="font-weight: 700; text-transform: capitalize;">${a.replace("_"," ")}</div>
                        <small style="color: var(--text-secondary)">${r.latency||"v\xEDa HTTPS"}</small>
                    </div>
                </div>
                <span class="status-badge ${r.status==="ok"?"active":"inactive"}">
                    ${r.status==="ok"?"Online":r.status==="maintenance"?"Mant.":"Error"}
                </span>
            </div>
        `).join("")}catch{e.innerHTML='<div class="error-msg" style="display:block">Error cargando estado del sistema</div>'}},"loadSystemStatus"),k=n(async()=>{const e=document.getElementById("config-list-container");if(e)try{const s=[{key:"NODE_ENV",value:"production"},{key:"PORT",value:"3000"},{key:"TWITCH_CLIENT_ID",value:"********"},{key:"GROQ_API_KEY",value:"Suministrada \u2705"},{key:"ADMIN_ENABLED",value:"true"}];e.innerHTML=s.map(t=>`
            <div class="config-item">
                <span class="config-key">${t.key}</span>
                <span class="config-value">${t.value}</span>
            </div>
        `).join("")}catch{e.innerHTML='<div class="error-msg" style="display:block">Error cargando configuraci\xF3n</div>'}},"loadConfig");window.blockUser=async e=>{const s=prompt("\xBFRaz\xF3n del bloqueo?");if(s!==null)try{(await i(`/api/twitch/admin/users/${e}/status`,{method:"POST",body:JSON.stringify({isActive:!1,reason:s})})).ok?(l(),o("\xC9xito","Usuario bloqueado correctamente","success")):o("Error","No se pudo bloquear al usuario","error")}catch(t){console.error(t),o("Error","Error de conexi\xF3n","error")}},window.unblockUser=async e=>{if(confirm("\xBFEst\xE1s seguro de desbloquear a este usuario?"))try{(await i(`/api/twitch/admin/users/${e}/status`,{method:"POST",body:JSON.stringify({isActive:!0})})).ok?(l(),o("\xC9xito","Usuario desbloqueado","success")):o("Error","No se pudo desbloquear al usuario","error")}catch(s){console.error(s),o("Error","Error de conexi\xF3n","error")}},window.resetKey=async e=>{if(confirm("\xBFGenerar nueva API Key? La anterior dejar\xE1 de funcionar."))try{(await i(`/api/twitch/admin/users/${e}/reset-key`,{method:"POST"})).ok?(l(),o("API Key Generada","El usuario tiene una nueva clave","success")):o("Error","No se pudo resetear la clave","error")}catch(s){console.error(s),o("Error","Error de conexi\xF3n","error")}},window.deleteUser=async e=>{if(confirm("\xBFELIMINAR usuario permanentemente? Esta acci\xF3n no se puede deshacer."))try{(await i(`/api/twitch/admin/users/${e}`,{method:"DELETE"})).ok?(l(),o("\xC9xito","Se ha borrado el usuario y sus datos","success")):o("Error","No se pudo eliminar al usuario","error")}catch(s){console.error(s),o("Error","Error de conexi\xF3n","error")}},window.updateRateLimit=async(e,s)=>{const t=prompt("Asignar nuevo l\xEDmite de peticiones (req/min):",s.toString());if(t===null)return;const a=parseInt(t);if(isNaN(a)||a<0){o("Error","El l\xEDmite debe ser un n\xFAmero v\xE1lido >= 0","error");return}try{const r=await i(`/api/twitch/admin/users/${e}/rate-limit`,{method:"POST",body:JSON.stringify({limit:a})});if(r.ok)l(),o("\xC9xito",`L\xEDmite actualizado a ${a} req/min`,"success");else{const c=await r.json();o("Error",c.error||"No se pudo actualizar el l\xEDmite","error")}}catch(r){console.error(r),o("Error","Error de conexi\xF3n","error")}},window.addAdminPrompt=async()=>{const e=prompt("Ingresa el Twitch ID num\xE9rico del nuevo administrador:");if(e)try{const s=await i("/api/twitch/admin/admins",{method:"POST",body:JSON.stringify({userId:e})});if(s.ok)o("\xC9xito","Administrador a\xF1adido correctamente","success"),u();else{const t=await s.json();o("Error",t.error||"No se pudo a\xF1adir al admin","error")}}catch{o("Error","Error de conexi\xF3n","error")}},window.removeAdmin=async e=>{if(confirm("\xBFQuitar permisos de administrador a este usuario?"))try{const s=await i(`/api/twitch/admin/admins/${e}`,{method:"DELETE"});if(s.ok)o("\xC9xito","Permisos revocados","success"),u();else{const t=await s.json();o("Error",t.error||"No se pudo quitar al admin","error")}}catch{o("Error","Error de conexi\xF3n","error")}};const u=n(async()=>{const e=document.getElementById("admins-table-body");if(e)try{const s=await i("/api/twitch/admin/admins");if(!s.ok)throw new Error("Failed to load admins");const{admins:t,rootId:a}=await s.json();if(t.length===0){e.innerHTML='<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted)">No hay administradores adicionales</td></tr>';return}e.innerHTML=t.map(r=>{const c=r.userId===a;return`
            <tr>
                <td>
                    <div style="font-weight: 600;">${r.displayName}</div>
                    <small style="color: var(--text-muted)">@${r.login}</small>
                </td>
                <td><code style="background: #222; padding: 2px 6px; border-radius: 4px;">${r.userId}</code></td>
                <td>
                    <span class="status-badge ${c?"active":"warn"}" style="font-size: 11px;">
                        ${c?"Root Admin":"Admin Delegado"}
                    </span>
                </td>
                <td>
                    ${c?'<small style="color: var(--text-muted)">Protegido</small>':`
                        <button class="action-btn delete" onclick="window.removeAdmin('${r.userId}')" title="Quitar Permisos">
                            <i class="fa-solid fa-user-minus"></i>
                        </button>
                    `}
                </td>
            </tr>
        `}).join("")}catch{e.innerHTML='<tr><td colspan="4" class="error-msg" style="display:block">Error cargando administradores</td></tr>'}},"loadAdmins");window.logout=v,console.log("Dashboard script loaded"),y(),E(),window.switchSection("overview");
