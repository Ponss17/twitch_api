var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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

// frontend/shared/i18n/messages.ts
var Messages = {
  Common: {
    loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
    error: /* @__PURE__ */ __name((msg) => `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`, "error"),
    networkError: "Error de conexi\xF3n",
    sessionExpiredMsg: "Tu sesi\xF3n ha expirado. Por favor, inicia sesi\xF3n de nuevo.",
    errorLoadingUI: /* @__PURE__ */ __name((msg) => `Error cargando interfaz: ${msg}`, "errorLoadingUI"),
    viewBtn: '<i class="fa-solid fa-eye"></i> Ver',
    saveBtn: '<i class="fa-solid fa-save"></i> Guardar',
    cancelBtn: '<i class="fa-solid fa-xmark"></i> Cancelar',
    connectionError: "Error de conexi\xF3n",
    welcome: /* @__PURE__ */ __name((name) => `Bienvenido, ${name}`, "welcome")
  }
};

// frontend/shared/i18n/authMessages.ts
var AuthMessages = {
  sessionExpired: "Tu sesi\xF3n ha expirado",
  validationError: "Error al validar sesi\xF3n",
  sessionError: "Error de sesi\xF3n. Recarga la p\xE1gina.",
  expiredTitle: "Sesi\xF3n Expirada",
  expiredMsg: "Tu credencial ha caducado. Por favor, inicia sesi\xF3n de nuevo.",
  reloginBtn: '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesi\xF3n',
  expired: "Sesi\xF3n expirada. Por favor, inicia sesi\xF3n de nuevo."
};

// frontend/shared/utils/errorHandler.ts
var _ErrorHandler = class _ErrorHandler {
  constructor() {
    this.isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    this.init();
  }
  init() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(String(message)), {
        source,
        lineno,
        colno
      });
      return true;
    };
    window.onunhandledrejection = (event) => {
      this.handleError(event.reason, {
        type: "unhandledRejection"
      });
      event.preventDefault();
    };
  }
  handleError(error, context = {}) {
    if (this.isDevelopment) {
      console.error("\u{1F534} Error capturado por ErrorHandler:", error);
      console.error("Contexto:", context);
    }
    const userMessage = this.getUserMessage(error);
    UI.showToast(userMessage, "error");
  }
  getUserMessage(error) {
    const msg = error instanceof Error ? error.message : String(error || "");
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
      return Messages.Common.networkError;
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg === "auth_error") {
      return AuthMessages.sessionExpired;
    }
    if (msg.includes("403") || msg.includes("forbidden")) {
      return AuthMessages.validationError;
    }
    return this.isDevelopment ? `Error: ${msg}` : Messages.Common.error("Algo sali\xF3 mal. Intenta de nuevo.");
  }
  reportError(error, context) {
    if (this.isDevelopment) {
      console.warn("Reported Error:", error, context);
    }
  }
};
__name(_ErrorHandler, "ErrorHandler");
var ErrorHandler = _ErrorHandler;
var errorHandler = new ErrorHandler();
export {
  errorHandler
};
