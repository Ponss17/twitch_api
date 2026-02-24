var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/stalker/messages.ts
var StalkerMessages = {
  loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando Chat...',
  empty: `
        <div class="empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>Nadie en el chat (o error de conexi\xF3n)</p>
        </div>
    `,
  waiting: `
        <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
        <h3>Esperando se\xF1al...</h3>
        <p>Dale al bot\xF3n <strong>Play</strong> para comenzar a escanear el chat.</p>
    `,
  syncNote: "* Lista sincronizada con API + Chat en vivo",
  reauthError: `
        <div class="error-msg" style="text-align: center; padding: 20px;">
            <i class="fa-solid fa-lock" style="font-size: 2rem; margin-bottom: 10px; color: var(--accent);"></i>
            <h3>Faltan Permisos</h3>
            <p>Para ver el chat, necesitas autorizar el acceso.</p>
            <button id="reauth-btn" class="btn-primary" style="margin-top: 10px;">
                <i class="fa-brands fa-twitch"></i> Conectar de nuevo
            </button>
        </div>
    `,
  userInfo: /* @__PURE__ */ __name((info) => `
        \u{1F464} ${info.display_name}
        \u{1F4C5} Creado: ${new Date(info.created_at).toLocaleDateString()}
        \u{1F441}\uFE0F Vistas: ${info.view_count}
        \u{1F4DD} Bio: ${info.description || "Sin bio"}
    `, "userInfo"),
  updated: '<i class="fa-solid fa-check"></i> Lista Stalker recargada',
  updatedRaw: "Lista Stalker recargada",
  bioEmpty: "Sin biograf\xEDa disponible.",
  apiError: "Error API",
  infoError: "No se pudo cargar info del usuario",
  reloginMsg: "Necesitas re-login (Permisos)",
  loadError: "No se pudo cargar info del usuario",
  scanStarted: '<i class="fa-solid fa-satellite-dish fa-beat" style="--fa-beat-scale: 1.2;"></i> Escaneo iniciado',
  scanStartedRaw: "Escaneo iniciado",
  scanPaused: '<i class="fa-solid fa-snowflake" style="color:#00f2ea"></i> Vista Congelada (Pausado)',
  scanPausedRaw: "Vista Congelada (Pausado)",
  tableHeaders: {
    avatar: "Avatar",
    user: "Usuario",
    login: "Login",
    action: "Acci\xF3n"
  },
  scanControls: {
    pause: "Pausar Escaneo",
    start: "Iniciar Escaneo",
    searchPlaceholder: "Buscar usuario...",
    refresh: "Recargar lista"
  },
  detectionNote: "* La detecci\xF3n de usuarios se basa en la actividad reciente del chat.",
  rowsLoading: "Cargando usuarios..."
};

// frontend/shared/i18n/uiMessages.ts
var UIMessages = {
  Clipboard: {
    copied: "\xA1Copiado!",
    error: "Error al copiar"
  },
  ChatSim: {
    welcome: "\xA1Bienvenido al chat!",
    placeholder: "Enviar un mensaje",
    btnText: "Chat",
    followage: /* @__PURE__ */ __name((user, channel, time) => `@${user} sigue a @${channel} desde hace ${time}.`, "followage"),
    clip: /* @__PURE__ */ __name((user, url) => `\u{1F3AC} Clip creado por <span style="color:#FF69B4">@${user}</span>: ${url}`, "clip"),
    shoutout: /* @__PURE__ */ __name((user, game) => `\xA1Vayan a seguir a <span style="color:#bf94ff">@${user}</span>! Estaba jugando ${game}`, "shoutout")
  }
};

// frontend/core/ui-core.ts
var UI = {
  clipboardInitialized: false,
  escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  },
  showToast(message, type = "success", customIcon) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "alert");
    const icon = customIcon || (type === "success" ? "fa-check-circle" : "fa-triangle-exclamation");
    toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> <span></span>`;
    const textSpan = toast.querySelector("span");
    textSpan.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hiding");
      toast.addEventListener("animationend", () => {
        if (toast.parentElement) {
          toast.remove();
        }
      });
    }, 4e3);
  },
  copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`<i class="fa-solid fa-check"></i> ${UIMessages.Clipboard.copied}`);
    }).catch(() => {
      this.showToast(
        `<i class="fa-solid fa-xmark"></i> ${UIMessages.Clipboard.error}`,
        "error"
      );
    });
  },
  setupClipboard() {
    if (this.clipboardInitialized) return;
    this.clipboardInitialized = true;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const targetId = btn.dataset.target;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          const valueToCopy = target.dataset.realValue || target.value || target.innerText;
          this.copyToClipboard(valueToCopy);
        }
      }
    });
  },
  setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.classList.add("btn-loading");
      button.disabled = true;
      button.dataset.originalText = button.textContent || "";
    } else {
      button.classList.remove("btn-loading");
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  },
  disableButton(button) {
    if (!button) return;
    button.disabled = true;
    button.classList.add("btn-disabled");
  },
  enableButton(button) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove("btn-disabled");
  },
  setCardLoading(card, isLoading) {
    if (!card) return;
    if (isLoading) {
      card.classList.add("card-loading");
    } else {
      card.classList.remove("card-loading");
    }
  },
  animateValue(obj, start, end, duration = 1500, suffix = "") {
    const textWithoutHtml = obj.innerHTML.replace(/<[^>]*>?/gm, "");
    const currentVal = parseInt(textWithoutHtml.replace(/[^0-9.-]+/g, "")) || 0;
    const actualStart = start !== null ? start : currentVal;
    if (actualStart === end) {
      obj.innerHTML = `${end.toLocaleString()}${suffix}`;
      return;
    }
    let startTimestamp = null;
    const step = /* @__PURE__ */ __name((timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * (end - actualStart) + actualStart);
      obj.innerHTML = `${current.toLocaleString()}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = `${end.toLocaleString()}${suffix}`;
      }
    }, "step");
    window.requestAnimationFrame(step);
  }
};

// frontend/features/dashboard/stalker/templates.ts
var StalkerTemplates = {
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
    const btnClass = isScanning ? "btn-warning" : "btn-success";
    const btnIcon = isScanning ? "fa-pause" : "fa-play";
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
    const tr = document.createElement("tr");
    tr.className = "stalker-row";
    const avatarTd = document.createElement("td");
    const safeUrl = UI.escapeHTML(user.profile_image_url || "");
    const safeName = UI.escapeHTML(user.user_name);
    avatarTd.innerHTML = user.profile_image_url ? `<img src="${safeUrl}" class="table-avatar-img" loading="lazy" alt="${safeName}">` : `<div class="table-avatar-empty"><i class="fa-solid fa-user"></i></div>`;
    const nameTd = document.createElement("td");
    nameTd.className = "word-text text-bold";
    nameTd.textContent = user.user_name;
    const loginTd = document.createElement("td");
    loginTd.className = "count-text text-muted-color";
    loginTd.textContent = `@${user.user_login}`;
    const actionTd = document.createElement("td");
    actionTd.className = "text-right";
    const btn = document.createElement("button");
    btn.className = "action-btn inspect-btn";
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
      const tr = document.createElement("tr");
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
export {
  StalkerTemplates
};
