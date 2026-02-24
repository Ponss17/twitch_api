var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/feedback/messages.ts
var FeedbackMessages = {
  emptyMessage: "Por favor, escribe un mensaje.",
  sending: '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...',
  defaultButton: '<i class="fa-solid fa-paper-plane"></i> Enviar Feedback',
  success: "\xA1Feedback enviado! Gracias por tu aporte.",
  error: "Error al enviar. Intenta m\xE1s tarde.",
  connectionError: "Error de conexi\xF3n."
};

// frontend/features/dashboard/dashboard-config.ts
var API_BASE = "/api/twitch";
var DASHBOARD_CONFIG = {
  API_ENDPOINTS: {
    BASE: API_BASE,
    MAGIC8: `${API_BASE}/minigames/magic8`,
    ANALYTICS: `${API_BASE}/dashboard/analytics`,
    REGENERATE_KEY: `${API_BASE}/system/regenerate-key`,
    FEEDBACK: `${API_BASE}/system/feedback`,
    CHATTERS: `${API_BASE}/dashboard/chatters`,
    USER_INFO: `${API_BASE}/dashboard/user-info`,
    SEND_MESSAGE: `${API_BASE}/send-message`,
    CLIPS: `${API_BASE}/dashboard/get-clips`,
    ACTIVITY: `${API_BASE}/dashboard/activity`,
    CLEAR_DATA: `${API_BASE}/dashboard/clear-data`,
    DELETE_ACCOUNT: `${API_BASE}/dashboard/delete-account`,
    HEALTH: `/api/twitch/system/health`,
    DUEL: `${API_BASE}/minigames/duel`
  },
  IGNORED_BOTS: /* @__PURE__ */ new Set([
    "nightbot",
    "streamelements",
    "fossabot",
    "moobot",
    "wizebot",
    "soundalert",
    "rainmaker",
    "botrixoficial",
    "trackerggbot",
    "streamlabs",
    "cloudbot",
    "deepbot",
    "phantombot",
    "streamerbot",
    "stayhydratedbot",
    "commanderroot",
    "own3d",
    "streamholics",
    "anotherttvviewer",
    "electricallongboard"
  ]),
  DOM_IDS: {
    MAGIC8: {
      INPUT: "magic8-question",
      BUTTON: "btn-ask-magic8",
      RESPONSE: "magic8-response",
      COMMAND_OUTPUT: "magic8-command-output",
      BOT_SELECT: "magic8-bot-select",
      MOOD_SELECT: "magic8-mood-select"
    },
    DUEL: {
      INPUT_TARGET: "duel-target",
      INPUT_CHALLENGER: "duel-challenger",
      BUTTON: "btn-fight-duel",
      RESPONSE: "duel-response"
    }
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

// frontend/features/dashboard/feedback.ts
var { API_ENDPOINTS } = DASHBOARD_CONFIG;
var FeedbackModule = {
  session: null,
  initialized: false,
  uiInitialized: false,
  init(session) {
    this.session = session;
    this.initialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.setupUI();
      this.uiInitialized = true;
    }
  },
  deactivate() {
  },
  setupUI() {
    requestAnimationFrame(() => {
      const sendFeedbackBtn = document.getElementById("send-feedback-btn");
      if (sendFeedbackBtn && !sendFeedbackBtn.dataset.listener) {
        sendFeedbackBtn.addEventListener("click", () => this.sendFeedback());
        sendFeedbackBtn.dataset.listener = "true";
      }
    });
  },
  async sendFeedback() {
    const submitBtn = document.getElementById("send-feedback-btn");
    const messageInput = document.getElementById("feedback-message");
    if (!submitBtn || !messageInput) return;
    const message = messageInput.value.trim();
    if (!message) {
      UI.showToast(FeedbackMessages.emptyMessage, "error");
      return;
    }
    UI.setButtonLoading(submitBtn, true);
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.session?.token) {
        headers["Authorization"] = `Bearer ${this.session.token}`;
      }
      const body = {
        message
      };
      if (!this.session?.token && this.session?.apiKey) {
        body.apiKey = this.session.apiKey;
      }
      const response = await fetch(API_ENDPOINTS.FEEDBACK, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        UI.showToast(FeedbackMessages.success, "success");
        messageInput.value = "";
      } else {
        throw new Error(data.error || data.message || "Failed to submit feedback");
      }
    } catch (e) {
      console.error("Error submitting feedback:", e);
      UI.showToast(e.message || FeedbackMessages.error, "error");
    } finally {
      UI.setButtonLoading(submitBtn, false);
    }
  }
};
export {
  FeedbackModule
};
