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

// frontend/features/dashboard/magic8/messages.ts
var Magic8Messages = {
  emptyQuestion: "\u26A0\uFE0F Debes hacer una pregunta primero.",
  consulting: '<i class="fa-solid fa-spinner fa-spin"></i> Consultando...',
  loading: '<div class="magic8-loading"><i class="fa-solid fa-crystal-ball fa-beat"></i> Consultando a los esp\xEDritus...</div>',
  askButton: '<i class="fa-solid fa-play"></i> Preguntar',
  error: /* @__PURE__ */ __name((msg) => `\u274C ${msg}`, "error")
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

// frontend/features/dashboard/magic8/module.ts
var { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
var Magic8Module = {
  session: null,
  initialized: false,
  uiInitialized: false,
  cssLoaded: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/magic8.css");
      });
      this.cssLoaded = true;
    }
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
    const questionInput = document.getElementById(DOM_IDS.MAGIC8.INPUT);
    const askBtn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);
    if (!questionInput || !askBtn) return;
    const handleAsk = /* @__PURE__ */ __name(() => this.askQuestion(), "handleAsk");
    askBtn.onclick = handleAsk;
    questionInput.onkeypress = (e) => {
      if (e.key === "Enter") handleAsk();
    };
  },
  setLoading(isLoading) {
    const btn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);
    const input = document.getElementById(DOM_IDS.MAGIC8.INPUT);
    const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
    if (isLoading) {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = Magic8Messages.consulting;
      }
      if (input) input.disabled = true;
      if (responseEl) {
        responseEl.className = "response-card active";
        responseEl.innerHTML = Magic8Messages.loading;
      }
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = Magic8Messages.askButton;
      }
      if (input) input.disabled = false;
    }
  },
  async askQuestion() {
    const input = document.getElementById(DOM_IDS.MAGIC8.INPUT);
    const question = input?.value.trim();
    if (!question) {
      this.showResponse(Magic8Messages.emptyQuestion, "error");
      return;
    }
    this.setLoading(true);
    try {
      if (!this.session) throw new Error("No active session");
      const { apiKey, token, login } = this.session;
      const mood = document.getElementById("extra-magic8-mood")?.value || "classic";
      const tokenParam = apiKey ? `apiKey=${encodeURIComponent(apiKey)}` : token ? `token=${encodeURIComponent(token)}` : "";
      const url = `${API_ENDPOINTS.MAGIC8}?${tokenParam}&question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(login || "")}`;
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const answer = await res.text();
        this.showResponse(answer, "success");
      } else {
        const { formatApiError: formatApiError2 } = await Promise.resolve().then(() => (init_api_errors(), api_errors_exports));
        const errorMsg = await formatApiError2(res);
        this.showResponse(`Error: ${errorMsg}`, "error");
      }
    } catch (error) {
      this.showResponse(Magic8Messages.error(error.message), "error");
    } finally {
      this.setLoading(false);
      if (input) {
        input.value = "";
        input.focus();
      }
    }
  },
  showResponse(text, type) {
    const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
    if (responseEl) {
      responseEl.className = `response-card ${type} active`;
      const icon = type === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
      responseEl.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${text}</span>
            `;
    }
  }
};
export {
  Magic8Module
};
