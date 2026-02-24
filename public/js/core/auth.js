var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// frontend/shared/i18n/uiMessages.ts
var UIMessages;
var init_uiMessages = __esm({
  "frontend/shared/i18n/uiMessages.ts"() {
    "use strict";
    UIMessages = {
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
  }
});

// frontend/core/ui-core.ts
var UI;
var init_ui_core = __esm({
  "frontend/core/ui-core.ts"() {
    "use strict";
    init_uiMessages();
    UI = {
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
  }
});

// frontend/core/ui.ts
var ui_exports = {};
__export(ui_exports, {
  UI: () => UI
});
var init_ui = __esm({
  "frontend/core/ui.ts"() {
    "use strict";
    init_ui_core();
  }
});

// frontend/config.ts
var protocol = window.location.protocol;
var host = window.location.host;
var API_BASE = "/api/twitch";
var CONFIG = {
  domain: host,
  siteUrl: `${protocol}//${host}`,
  API_URL: API_BASE,
  twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`
};
Object.freeze(CONFIG);

// frontend/core/auth.ts
var Auth = {
  getSession() {
    try {
      const item = localStorage.getItem("twitch_api_session");
      return item ? JSON.parse(item) : null;
    } catch (_e) {
      return null;
    }
  },
  saveSession(sessionData) {
    localStorage.setItem("twitch_api_session", JSON.stringify(sessionData));
  },
  clearSession() {
    localStorage.removeItem("twitch_api_session");
  },
  logout() {
    this.clearSession();
    window.location.href = window.location.origin + window.location.pathname;
  },
  async validateCurrentToken(credentialParam) {
    try {
      if (!credentialParam) return { valid: false, reason: "no_credentials" };
      const response = await fetch(`${CONFIG.API_URL}/system/validate?${credentialParam}`);
      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, status: 401, reason: "unauthorized" };
        }
        console.warn(`Server error ${response.status} during validation.`);
        return {
          valid: false,
          error: true,
          status: response.status,
          reason: "server_error"
        };
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        return data.valid ? data : { valid: false, reason: "invalid_response" };
      }
      return { valid: true };
    } catch (e) {
      console.error("Network error validating token:", e);
      return { valid: true, error: true, reason: "network_error" };
    }
  },
  async syncApiKey(session) {
    if (!session.userId) return session;
    try {
      const credentialParam = session.token ? `token=${session.token}` : `apiKey=${session.apiKey}`;
      const validation = await this.validateCurrentToken(credentialParam);
      if (validation && typeof validation === "object" && "apiKey" in validation) {
        const serverApiKey = validation.apiKey;
        if (serverApiKey && serverApiKey !== session.apiKey) {
          session.apiKey = serverApiKey;
          this.saveSession(session);
          Promise.resolve().then(() => (init_ui(), ui_exports)).then(({ UI: UI2 }) => {
            UI2.showToast("Tu API Key ha sido actualizada", "info");
          });
        }
      }
      return session;
    } catch (_e) {
      return session;
    }
  },
  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const savedSession = this.getSession();
    const session = {
      login: params.get("login") || savedSession?.login || "",
      displayName: params.get("displayName") || savedSession?.displayName || "",
      profile_image_url: savedSession?.profile_image_url || "",
      token: params.get("token") || savedSession?.token,
      apiKey: params.get("apiKey") || savedSession?.apiKey,
      userId: params.get("userId") || savedSession?.userId,
      isNewLogin: !!params.get("token") || !!params.get("apiKey")
    };
    return session;
  },
  setupLoginButton(loginBtnId) {
    const loginBtn = document.getElementById(loginBtnId);
    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.relogin();
      });
    }
  },
  relogin() {
    this.clearSession();
    let currentUrl = window.location.origin + window.location.pathname;
    currentUrl = currentUrl.replace("://www.", "://");
    const authPath = `${CONFIG.API_URL}/auth/twitch`;
    window.location.href = `${authPath}?redirect_origin=${encodeURIComponent(currentUrl)}`;
  }
};
export {
  Auth
};
