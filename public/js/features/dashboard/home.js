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

// frontend/shared/utils/loader.ts
var Loader = {
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

// frontend/features/dashboard/home.ts
var { API_ENDPOINTS } = DASHBOARD_CONFIG;
var HomeModule = {
  session: null,
  isInitialized: false,
  pollInterval: null,
  countdown: 15,
  lastStats: {
    todayRequests: -1,
    successRate: -1,
    latency: -1
  },
  init(session) {
    this.session = session;
    this.isInitialized = true;
  },
  get authHeaders() {
    const headers = {};
    if (this.session?.token) headers["Authorization"] = `Bearer ${this.session.token}`;
    return headers;
  },
  get authQuery() {
    if (this.session?.apiKey) return `apiKey=${encodeURIComponent(this.session.apiKey)}`;
    if (this.session?.token) return `token=${encodeURIComponent(this.session.token)}`;
    return "";
  },
  activate() {
    Loader.loadCSS("./css/sections/home.css");
    this.setupUI();
    this.startSmartPolling();
  },
  deactivate() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },
  startSmartPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    const lastSync = localStorage.getItem("dashboard_last_sync");
    const now = Date.now();
    const pollMs = 15e3;
    if (lastSync) {
      const elapsed = now - parseInt(lastSync);
      if (elapsed < pollMs) {
        this.countdown = Math.ceil((pollMs - elapsed) / 1e3);
      } else {
        this.countdown = 15;
        this.performSync();
      }
    } else {
      this.countdown = 15;
      this.performSync();
    }
    this.updateSyncIndicator();
    this.pollInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.performSync();
        this.countdown = 15;
      }
      this.updateSyncIndicator();
    }, 1e3);
  },
  async performSync() {
    const syncEl = document.getElementById("home-sync-indicator");
    if (syncEl) syncEl.classList.add("syncing");
    localStorage.setItem("dashboard_last_sync", Date.now().toString());
    await Promise.all([this.loadRealActivity(), this.loadRealStats(), this.loadRealHealth()]);
    setTimeout(() => {
      if (syncEl) syncEl.classList.remove("syncing");
    }, 1e3);
  },
  updateSyncIndicator() {
    const syncEl = document.getElementById("home-sync-indicator");
    if (!syncEl) return;
    syncEl.textContent = "Auto";
  },
  updateValues() {
    if (this.session) {
      const heroName = document.getElementById("hero-user-name");
      if (heroName) {
        heroName.textContent = this.session.displayName || this.session.login || "Streamer";
      }
    }
  },
  setupUI() {
    this.updateValues();
    this.setupNavigation();
  },
  setupNavigation() {
    const btns = document.querySelectorAll(".clickable-tab");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        if (!tabId) return;
        const sidebarBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (sidebarBtn) {
          sidebarBtn.click();
        }
      });
    });
  },
  async loadRealHealth() {
    const pill = document.getElementById("home-health-pill");
    const label = pill?.querySelector(".status-label");
    if (!pill || !label || !this.session) return;
    try {
      const q = this.authQuery ? `?${this.authQuery}` : "";
      const response = await fetch(`${API_ENDPOINTS.HEALTH}${q}`, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const health = await response.json();
        label.textContent = health.status === "operational" ? "Todos los Sistemas Operativos" : "Sistemas Degradados";
        pill.className = `system-status-pill ${health.status}`;
      }
    } catch (e) {
      console.error("[Home] Error loading health:", e);
      label.textContent = "Error de Conexi\xF3n";
      pill.className = "system-status-pill down";
    }
  },
  async loadRealActivity() {
    const logContainer = document.getElementById("home-activity-logs");
    if (!logContainer || !this.session) return;
    try {
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const response = await fetch(`${API_ENDPOINTS.ACTIVITY}?_=${Date.now()}${q}`, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const logs = await response.json();
        logContainer.innerHTML = "";
        if (logs.length === 0) {
          logContainer.classList.add("is-empty");
          logContainer.innerHTML = `
                        <div class="feed-empty-state">
                            <span class="empty-msg">esperando actividad...</span>
                            <span class="empty-cursor">_</span>
                        </div>
                    `;
          return;
        }
        logContainer.classList.remove("is-empty");
        logs.forEach((log) => {
          const time = new Date(log.timestamp).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit"
          });
          const logElement = document.createElement("div");
          logElement.className = "log-entry";
          logElement.innerHTML = `
                        <span class="log-time">[${time}]</span>
                        <span class="log-msg">${log.action}</span>
                    `;
          logContainer.appendChild(logElement);
        });
      }
    } catch (e) {
      console.error("[Home] Error loading activity:", e);
      logContainer.innerHTML = '<div class="log-placeholder text-danger">Error al conectar con el feed de actividad.</div>';
    }
  },
  async loadRealStats() {
    if (!this.session) return;
    try {
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?_=${Date.now()}${q}`, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        const { UI: UI2 } = await Promise.resolve().then(() => (init_ui(), ui_exports));
        const todayRequests = data.todayRequests || 0;
        const successRate = data.rawSuccessRate || 0;
        const avgLatencyMs = data.avgLatencyMs || 0;
        const reqEl = document.getElementById("home-stat-requests");
        const successEl = document.getElementById("home-stat-success");
        const latencyEl = document.getElementById("home-stat-latency");
        if (reqEl && this.lastStats.todayRequests !== todayRequests) {
          UI2.animateValue(reqEl, null, todayRequests);
          this.lastStats.todayRequests = todayRequests;
        } else if (reqEl) {
          reqEl.textContent = todayRequests.toLocaleString();
        }
        if (successEl && this.lastStats.successRate !== successRate) {
          UI2.animateValue(successEl, null, successRate, 1500, "%");
          this.lastStats.successRate = successRate;
        } else if (successEl) {
          successEl.textContent = `${successRate}%`;
        }
        if (latencyEl) {
          if (this.lastStats.latency !== avgLatencyMs) {
            const unit = `ms <span class="stat-unit-alt">(${(avgLatencyMs / 1e3).toFixed(1)}s)</span>`;
            UI2.animateValue(latencyEl, null, avgLatencyMs, 1500, unit);
            this.lastStats.latency = avgLatencyMs;
          } else if (avgLatencyMs === 0 && latencyEl.textContent === "0ms") {
            latencyEl.innerHTML = '0ms <span class="stat-unit-alt">(0.0s)</span>';
          }
        }
      }
    } catch (e) {
      console.error("[Home] Error loading stats:", e);
    }
  }
};
export {
  HomeModule
};
