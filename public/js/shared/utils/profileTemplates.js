var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/shared/i18n/profileMessages.ts
var ProfileMessages = {
  partner: "Socio",
  affiliate: "Afiliado",
  user: "Usuario",
  created: /* @__PURE__ */ __name((date) => `Cuenta creada el: ${new Date(date).toLocaleDateString()}`, "created"),
  new: "Nueva",
  years: /* @__PURE__ */ __name((y) => `${y} a\xF1o${y > 1 ? "s" : ""}`, "years"),
  months: /* @__PURE__ */ __name((m) => `${m} meses`, "months"),
  viewLogs: '<i class="fa-solid fa-comment-dots"></i> Ver \xDAltimos Mensajes',
  historyTitle: '<i class="fa-solid fa-history"></i> Historial (Sesi\xF3n actual)',
  noHistory: "No hay mensajes registrados en esta sesi\xF3n.",
  bioEmpty: "Sin biograf\xEDa disponible.",
  labels: {
    rank: "Rango",
    userId: "ID de Usuario",
    age: "Antig\xFCedad"
  }
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

// frontend/shared/utils/profileTemplates.ts
var ProfileTemplates = {
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
