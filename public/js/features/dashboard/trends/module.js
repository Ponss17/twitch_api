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

// frontend/features/dashboard/trends/messages.ts
var TrendsMessages = {
  title: /* @__PURE__ */ __name((channel) => `Tendencias de ${channel}`, "title"),
  noTmi: "TMI.js no cargado"
};
var TrackerMessages = {
  connected: '<span style="color:var(--success)"><i class="fa-solid fa-circle"></i> Conectado</span>',
  error: '<span style="color:var(--warning)"><i class="fa-solid fa-xmark"></i> Error</span>',
  waiting: '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando palabras...</td></tr>',
  timeUp: "\xA1TIEMPO!",
  started: /* @__PURE__ */ __name((min) => `<i class="fa-solid fa-hourglass-start fa-spin"></i>  Tracker iniciado (${min} min)`, "started"),
  startedRaw: /* @__PURE__ */ __name((min) => `Tracker iniciado (${min} min)`, "startedRaw"),
  finished: '<i class="fa-solid fa-flag-checkered"></i> \xA1Tiempo terminado!',
  finishedRaw: "\xA1Tiempo terminado!",
  winner: /* @__PURE__ */ __name((word, count) => `\u{1F451} Ganador: <strong>"${word}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`, "winner"),
  resting: '<i class="fa-solid fa-power-off"></i> Reposo',
  ready: `
        <tr>
            <td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">
                <div style="font-size:2rem; margin-bottom:10px;"><i class="fa-solid fa-play"></i></div>
                <h4 style="color:var(--text-primary); margin-bottom:5px;">Listo para analizar</h4>
                <p>Presiona el bot\xF3n <strong>Play</strong> para comenzar a contar palabras.</p>
            </td>
        </tr>
    `
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

// frontend/features/dashboard/trends/module.ts
init_ui();

// frontend/config.ts
var protocol = window.location.protocol;
var host = window.location.host;
var API_BASE2 = "/api/twitch";
var CONFIG = {
  domain: host,
  siteUrl: `${protocol}//${host}`,
  API_URL: API_BASE2,
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

// frontend/services/tmiService.ts
init_ui();

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

// frontend/services/tmiService.ts
var TmiService = {
  client: null,
  listeners: /* @__PURE__ */ new Map(),
  isConnected: false,
  activeClients: 0,
  connectionPromise: null,
  async connect(channel, auth) {
    this.activeClients++;
    if (this.connectionPromise) return this.connectionPromise;
    if (this.isConnected && this.client) return Promise.resolve();
    if (typeof window.tmi === "undefined") {
      this.activeClients = Math.max(0, this.activeClients - 1);
      return Promise.reject("TMI not loaded");
    }
    const options = {
      channels: [channel],
      connection: { secure: true, reconnect: true },
      options: {
        skipUpdatingEmotesets: true,
        messages: {
          emotes: false
        }
      }
    };
    if (auth) {
      options.identity = {
        username: auth.username,
        password: `oauth:${auth.token.replace("oauth:", "")}`
      };
    }
    this.client = new window.tmi.Client(options);
    const attachListeners = /* @__PURE__ */ __name((clientInstance) => {
      clientInstance.on("message", (...args) => {
        const [channel2, tags, message, self] = args;
        if (self) return;
        this.listeners.forEach((callback) => callback(channel2, tags, message));
      });
    }, "attachListeners");
    attachListeners(this.client);
    if (!this.client) return Promise.reject("Client initialization failed");
    this.connectionPromise = new Promise((resolve, reject) => {
      if (!this.client) return reject("Client not found");
      this.client.connect().then(() => {
        this.isConnected = true;
        resolve();
      }).catch(async (err) => {
        const isLoginError = auth && (err === "Login unsuccessful" || typeof err === "string" && err.includes("Login unsuccessful"));
        if (isLoginError) {
          console.error(
            "\u274C TMI Auth failed. Access Token may be invalid/expired for IRC."
          );
          console.warn("\u26A0\uFE0F Retrying anonymously...", err);
          delete options.identity;
          this.client = new window.tmi.Client(options);
          attachListeners(this.client);
          try {
            await this.client.connect();
            this.isConnected = true;
            UI.showToast("Conectado al chat de forma an\xF3nima (Lectura)", "warning");
            resolve();
          } catch (anonErr) {
            this.isConnected = false;
            this.activeClients = 0;
            reject(anonErr);
          }
        } else {
          console.error("\u274C TMI Connection Error:", err);
          this.isConnected = false;
          this.activeClients = 0;
          reject(err);
        }
      });
    });
    return this.connectionPromise;
  },
  addListener(id, callback) {
    this.listeners.set(id, callback);
  },
  removeListener(id) {
    this.listeners.delete(id);
  },
  sendMessage(channel, message) {
    if (this.client && this.isConnected) {
      this.client.say(channel, message).catch((err) => {
        console.error("Error sending message:", err);
        if (err === "Cannot send anonymous messages" || typeof err === "string" && err.includes("anonymous")) {
          UI.showToast("Inicia sesi\xF3n con Twitch para enviar mensajes", "warning");
        } else if (typeof err === "string" && err.includes("Login unsuccessful")) {
          UI.showToast(AuthMessages.sessionExpired, "error");
          setTimeout(() => Auth.relogin(), 2e3);
        }
      });
    } else {
      console.warn("Cannot send message: TMI not connected");
    }
  },
  disconnect() {
    if (this.activeClients > 0) this.activeClients--;
    if (this.activeClients === 0 && this.client && this.isConnected) {
      this.client.disconnect().then(() => {
        this.isConnected = false;
        this.client = null;
        this.connectionPromise = null;
        this.listeners.clear();
      });
    }
  }
};

// frontend/features/dashboard/trends/templates.ts
init_ui();
var TrendsTemplates = {
  renderRow(item, index, maxCount) {
    const [word, count] = item;
    const safeWord = UI.escapeHTML(word);
    const percentage = count / maxCount * 100;
    const rankClass = index < 3 ? `rank-${index + 1}` : "";
    const medal = index === 0 ? "\u{1F947}" : index === 1 ? "\u{1F948}" : index === 2 ? "\u{1F949}" : `#${index + 1}`;
    return `
            <tr class="fade-in ${rankClass}">
                <td><span class="rank-medal">${medal}</span></td>
                <td class="word-text" style="font-weight:600;">${safeWord}</td>
                <td class="count-text" style="text-align:right; font-size:1.1rem;">${count}</td>
                <td>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width:${percentage}%"></div>
                    </div>
                </td>
            </tr>
        `;
  }
};

// frontend/features/dashboard/trends/module.ts
var { IGNORED_BOTS } = DASHBOARD_CONFIG;
var TrendsModule = {
  wordCounts: {},
  isIgnored: /* @__PURE__ */ new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "o",
    "pero",
    "si",
    "no",
    "en",
    "de",
    "del",
    "a",
    "al",
    "con",
    "para",
    "por",
    "que",
    "qu\xE9",
    "es",
    "son",
    "se",
    "mi",
    "tu",
    "su",
    "yo",
    "me",
    "te",
    "le",
    "este",
    "esta",
    "estos",
    "estas",
    "ese",
    "esa",
    "esos",
    "esas",
    "como",
    "c\xF3mo",
    "cuando",
    "cu\xE1ndo",
    "donde",
    "d\xF3nde",
    "quien",
    "qui\xE9n",
    "solo",
    "s\xF3lo",
    "tan",
    "muy",
    "mucho",
    "poco",
    "m\xE1s",
    "menos",
    "http",
    "https",
    "www",
    "com"
  ]),
  messageLog: [],
  MAX_LOG_SIZE: 500,
  isTracking: false,
  isConnected: false,
  timerInterval: null,
  session: null,
  initialized: false,
  cssLoaded: false,
  uiInitialized: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/trends.css");
      });
      this.cssLoaded = true;
    }
    this.initialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.setupUI();
      this.updateUIState();
      this.uiInitialized = true;
    }
  },
  updateUIState() {
    if (!this.session) return;
    const { login, displayName, profile_image_url } = this.session;
    const titleEl = document.getElementById("tracker-title");
    if (titleEl) titleEl.textContent = TrendsMessages.title(displayName || login);
    const avatarEl = document.getElementById("tracker-avatar");
    const iconEl = document.getElementById("tracker-icon");
    if (profile_image_url && avatarEl && iconEl) {
      avatarEl.src = profile_image_url;
      avatarEl.style.display = "block";
      iconEl.style.display = "none";
    }
    this.render();
  },
  setupUI() {
    this.attachListeners();
  },
  attachListeners() {
    const resetBtn = document.getElementById("reset-tracker-btn");
    const startBtn = document.getElementById("start-timer-btn");
    if (resetBtn && !resetBtn.dataset.listener) {
      resetBtn.addEventListener("click", () => this.reset());
      resetBtn.dataset.listener = "true";
    }
    if (startBtn && !startBtn.dataset.listener) {
      startBtn.addEventListener("click", () => this.startTimer());
      startBtn.dataset.listener = "true";
    }
  },
  connect() {
    if (!this.session) return;
    const auth = this.session.token ? {
      username: this.session.login,
      token: this.session.token
    } : void 0;
    TmiService.connect(this.session.login, auth).then(() => {
      this.updateStatus(true);
      this.isConnected = true;
      TmiService.addListener("trends", (chn, tags, message) => {
        if (!this.isTracking) return;
        const username = tags.username;
        if (!username || IGNORED_BOTS.has(username.toLowerCase())) return;
        this.messageLog.unshift({ user: username, text: message, time: /* @__PURE__ */ new Date() });
        if (this.messageLog.length > this.MAX_LOG_SIZE) this.messageLog.pop();
        this.processMessage(message);
      });
    }).catch((err) => {
      console.error("Trends TMI Error:", err);
      this.updateStatus(false);
      UI.showToast(
        Messages.Common.connectionError || "Error connecting to chat",
        "error"
      );
      this.endTimer();
    });
  },
  updateStatus(connected) {
    const el = document.getElementById("tracker-status");
    if (!el) return;
    if (connected) {
      el.innerHTML = TrackerMessages.connected;
      el.style.color = "var(--success)";
    } else {
      el.innerHTML = !this.isTracking ? TrackerMessages.resting : TrackerMessages.error;
      el.style.color = !this.isTracking ? "var(--text-muted)" : "var(--danger)";
    }
  },
  startTimer() {
    this.isTracking = true;
    this.connect();
    const minutes = parseInt(document.getElementById("tracker-minutes")?.value) || 5;
    document.getElementById("tracker-input-container")?.classList.add("hidden");
    document.getElementById("tracker-timer")?.classList.remove("hidden");
    this.wordCounts = {};
    this.messageLog = [];
    this.runTimer(minutes * 60);
    this.render();
    UI.showToast(TrackerMessages.startedRaw(minutes), "success", "fa-hourglass-start fa-spin");
  },
  runTimer(seconds) {
    let remaining = seconds;
    const display = document.getElementById("tracker-timer");
    if (display) {
      display.classList.remove("hidden", "text-warning", "text-accent");
      display.classList.add("text-primary");
    }
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      remaining--;
      if (display) display.textContent = this.formatTime(remaining);
      if (remaining <= 0) this.endTimer();
    }, 1e3);
  },
  endTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTracking = false;
    TmiService.disconnect();
    this.isConnected = false;
    this.updateStatus(false);
    const display = document.getElementById("tracker-timer");
    display?.classList.replace("text-primary", "text-warning");
    const entries = Object.entries(this.wordCounts);
    if (entries.length > 0) {
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      UI.showToast(TrackerMessages.winner(sorted[0][0], sorted[0][1]), "success");
    } else {
      UI.showToast(TrackerMessages.finishedRaw, "success", "fa-flag-checkered");
    }
    this.render();
  },
  formatTime(s) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  },
  processMessage(msg) {
    const firstWord = msg.toLowerCase().split(/\s+/)[0]?.replace(/[^\wñáéíóúü]/g, "");
    if (firstWord && firstWord.length > 2 && !this.isIgnored.has(firstWord)) {
      this.wordCounts[firstWord] = (this.wordCounts[firstWord] || 0) + 1;
      this.render();
    }
  },
  reset() {
    this.wordCounts = {};
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTracking = false;
    TmiService.removeListener("trends");
    TmiService.disconnect();
    this.isConnected = false;
    this.updateStatus(false);
    document.getElementById("tracker-input-container")?.classList.remove("hidden");
    document.getElementById("tracker-timer")?.classList.add("hidden");
    this.render();
  },
  renderPending: false,
  getMessagesByUser(username) {
    return this.messageLog.filter(
      (log) => log.user.toLowerCase() === username.toLowerCase()
    );
  },
  deactivate() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    TmiService.removeListener("trends");
    TmiService.disconnect();
    this.isConnected = false;
    this.isTracking = false;
  },
  render() {
    if (this.renderPending) return;
    this.renderPending = true;
    requestAnimationFrame(() => {
      const tbody = document.getElementById("tracker-body");
      if (tbody) {
        if (!this.isTracking && Object.keys(this.wordCounts).length === 0) {
          tbody.innerHTML = TrackerMessages.ready;
        } else {
          const entries = Object.entries(this.wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
          if (entries.length === 0) {
            tbody.innerHTML = TrackerMessages.waiting;
          } else {
            const maxCount = entries[0][1];
            tbody.innerHTML = entries.map(
              (item, i) => TrendsTemplates.renderRow(item, i, maxCount)
            ).join("");
          }
        }
      }
      this.renderPending = false;
    });
  }
};
export {
  TrendsModule
};
