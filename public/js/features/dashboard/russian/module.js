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

// frontend/shared/utils/loader.ts
var loader_exports = {};
__export(loader_exports, {
  Loader: () => Loader
});
var Loader;
var init_loader = __esm({
  "frontend/shared/utils/loader.ts"() {
    "use strict";
    Loader = {
      loaded: /* @__PURE__ */ new Set(),
      loading: /* @__PURE__ */ new Map(),
      loadCSS(path) {
        if (this.loaded.has(path)) return Promise.resolve();
        if (this.loading.has(path)) return this.loading.get(path);
        const promise = new Promise((resolve, _reject) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = path;
          link.onload = () => {
            this.loaded.add(path);
            this.loading.delete(path);
            resolve();
          };
          link.onerror = (_e) => {
            this.loading.delete(path);
            this.loaded.add(path);
            console.warn(
              `[Loader] Warning: Failed to load CSS: ${path}. Proceeding without it.`
            );
            resolve();
          };
          document.head.appendChild(link);
        });
        this.loading.set(path, promise);
        return promise;
      }
    };
  }
});

// frontend/shared/utils/api-errors.ts
var api_errors_exports = {};
__export(api_errors_exports, {
  formatApiError: () => formatApiError
});
var formatApiError;
var init_api_errors = __esm({
  "frontend/shared/utils/api-errors.ts"() {
    "use strict";
    formatApiError = /* @__PURE__ */ __name(async (response) => {
      try {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json.details && Array.isArray(json.details) && json.details.length > 0) {
            return json.details[0].message;
          }
          if (json.error) return json.error;
          if (json.message) return json.message;
          return text;
        } catch {
          return text.length > 100 ? text.substring(0, 97) + "..." : text;
        }
      } catch (_e) {
        return "Error desconocido al procesar la respuesta del servidor";
      }
    }, "formatApiError");
  }
});

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

// frontend/features/dashboard/russian/module.ts
var RussianModule = {
  session: null,
  gameEndpoint: `${DASHBOARD_CONFIG.API_ENDPOINTS.BASE}/minigames/russian`,
  cssLoaded: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/russian.css");
      });
      this.cssLoaded = true;
    }
  },
  activate() {
    const btn = document.getElementById("btn-fire-russian");
    if (btn && !btn.dataset.listener) {
      btn.addEventListener("click", () => this.pullTrigger());
      btn.dataset.listener = "true";
    }
  },
  deactivate() {
  },
  setLoading(isLoading) {
    const btn = document.getElementById("btn-fire-russian");
    const responseEl = document.getElementById("russian-response");
    const gunIcon = document.getElementById("russian-gun-icon");
    if (isLoading) {
      if (btn) btn.disabled = true;
      if (gunIcon) {
        gunIcon.classList.add("fa-shake");
        gunIcon.style.color = "var(--accent)";
      }
      if (responseEl) {
        responseEl.className = "response-card active";
        responseEl.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Girando el cilindro...</span>
                `;
      }
    } else {
      if (btn) btn.disabled = false;
    }
  },
  showResponse(text, type) {
    const responseEl = document.getElementById("russian-response");
    const gunIcon = document.getElementById("russian-gun-icon");
    if (responseEl) {
      const icon = type === "success" ? "fa-circle-check" : "fa-skull";
      responseEl.className = `response-card ${type} active`;
      responseEl.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${text}</span>
            `;
      if (gunIcon) {
        gunIcon.classList.remove("fa-shake");
        if (type === "error") {
          gunIcon.style.color = "var(--danger)";
          gunIcon.classList.replace("fa-gun", "fa-skull");
        } else {
          gunIcon.style.color = "var(--success)";
        }
        setTimeout(() => {
          gunIcon.classList.replace("fa-skull", "fa-gun");
          gunIcon.style.color = "var(--text-muted)";
        }, 3e3);
      }
    }
  },
  async pullTrigger() {
    if (!this.session) return;
    this.setLoading(true);
    try {
      const { apiKey, token } = this.session;
      const params = new URLSearchParams({
        user: this.session.login,
        channel: this.session.login,
        hardcore: "false",
        format: "json"
      });
      if (apiKey) params.set("apiKey", apiKey);
      else if (token) params.set("token", token);
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(`${this.gameEndpoint}?${params.toString()}`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        this.showResponse(data.message, data.status === "dead" ? "error" : "success");
      } else {
        const { formatApiError: formatApiError2 } = await Promise.resolve().then(() => (init_api_errors(), api_errors_exports));
        const errorMsg = await formatApiError2(response);
        this.showResponse(`Error: ${errorMsg}`, "error");
      }
    } catch (error) {
      console.error("Error in Russian Roulette:", error);
      this.showResponse("La pistola se encasquill\xF3 (Error de API)", "error");
    } finally {
      this.setLoading(false);
    }
  }
};
export {
  RussianModule
};
