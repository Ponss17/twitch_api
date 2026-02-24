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

// frontend/features/dashboard/duel/messages.ts
var DuelMessages = {
  emptyTarget: "\u26A0\uFE0F Debes especificar un oponente.",
  fighting: '<i class="fa-solid fa-spinner fa-spin"></i> Peleando...',
  loading: '<div class="duel-loading"><i class="fa-solid fa-khanda fa-shake"></i> Calculando ganador...</div>',
  fightButton: '<i class="fa-solid fa-gavel"></i> \xA1DUELO!',
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

// frontend/features/dashboard/duel/module.ts
var { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
var DuelModule = {
  session: null,
  initialized: false,
  uiInitialized: false,
  cssLoaded: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/duel.css");
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
    const targetInput = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET);
    const fightBtn = document.getElementById(DOM_IDS.DUEL.BUTTON);
    if (!targetInput || !fightBtn) return;
    const handleFight = /* @__PURE__ */ __name(() => this.startDuel(), "handleFight");
    fightBtn.onclick = handleFight;
    targetInput.onkeypress = (e) => {
      if (e.key === "Enter") handleFight();
    };
  },
  setLoading(isLoading) {
    const btn = document.getElementById(DOM_IDS.DUEL.BUTTON);
    const inputTarget = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET);
    const inputChallenger = document.getElementById(
      DOM_IDS.DUEL.INPUT_CHALLENGER
    );
    const responseEl = document.getElementById(DOM_IDS.DUEL.RESPONSE);
    if (isLoading) {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = DuelMessages.fighting;
      }
      if (inputTarget) inputTarget.disabled = true;
      if (inputChallenger) inputChallenger.disabled = true;
      if (responseEl) {
        responseEl.className = "response-card active";
        responseEl.innerHTML = DuelMessages.loading;
      }
    } else {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = DuelMessages.fightButton;
      }
      if (inputTarget) inputTarget.disabled = false;
      if (inputChallenger) inputChallenger.disabled = false;
    }
  },
  async startDuel() {
    const inputTarget = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET);
    const inputChallenger = document.getElementById(
      DOM_IDS.DUEL.INPUT_CHALLENGER
    );
    const target = inputTarget?.value.trim();
    const challenger = inputChallenger?.value.trim();
    if (!target) {
      this.showResponse(DuelMessages.emptyTarget, "error");
      return;
    }
    this.setLoading(true);
    try {
      if (!this.session) throw new Error("No active session");
      const { apiKey, token } = this.session;
      const tokenParam = apiKey ? `apiKey=${encodeURIComponent(apiKey)}` : token ? `token=${encodeURIComponent(token)}` : "";
      const url = `${API_ENDPOINTS.DUEL}?${tokenParam}&target=${encodeURIComponent(target)}&challenger=${encodeURIComponent(challenger)}`;
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
      this.showResponse(DuelMessages.error(error.message), "error");
    } finally {
      this.setLoading(false);
    }
  },
  showResponse(_text, _type) {
    const responseEl = document.getElementById(DOM_IDS.DUEL.RESPONSE);
    if (responseEl) {
      responseEl.className = `response-card ${_type} active`;
      const icon = _type === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
      responseEl.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${_text}</span>
            `;
    }
  }
};
export {
  DuelModule
};
