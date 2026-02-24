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

// frontend/features/dashboard/roulette/module.ts
init_ui();

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

// frontend/features/dashboard/roulette/messages.ts
var RouletteMessages = {
  updated: '<i class="fa-solid fa-check"></i> Lista actualizada',
  updatedRaw: "Lista actualizada",
  noParticipants: "No hay participantes",
  emptyWheel: "Sin participantes",
  winner: /* @__PURE__ */ __name((name, count) => `\u{1F451} Ganador: <strong>"${name}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`, "winner"),
  open: '<i class="fa-solid fa-door-open"></i> Inscripciones Abiertas',
  openRaw: "Inscripciones Abiertas",
  closed: '<i class="fa-solid fa-door-closed"></i> Inscripciones Cerradas',
  closedRaw: "Inscripciones Cerradas",
  playToOpen: "Dale al Play \u25B6\uFE0F para abrir"
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

// frontend/features/dashboard/roulette/module.ts
var { API_ENDPOINTS, IGNORED_BOTS } = DASHBOARD_CONFIG;
var RouletteModule = {
  session: null,
  chatters: [],
  canvas: null,
  ctx: null,
  colors: ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"],
  startAngle: 0,
  arc: 0,
  spinTimeout: null,
  spinAngleStart: 10,
  spinTime: 0,
  spinTimeTotal: 0,
  isSpinning: false,
  isOpen: false,
  isConnected: false,
  isInitialized: false,
  cssLoaded: false,
  uiInitialized: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/roulette.css");
      });
      this.cssLoaded = true;
    }
    this.isInitialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.setupUI();
      this.updateUI();
      this.uiInitialized = true;
    }
  },
  deactivate() {
    this.isOpen = false;
    if (this.spinTimeout) cancelAnimationFrame(this.spinTimeout);
    TmiService.removeListener("roulette");
    TmiService.disconnect();
    this.isConnected = false;
    this.isSpinning = false;
  },
  setupUI() {
    this.canvas = document.getElementById("roulette-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    const spinBtn = document.getElementById("btn-spin-roulette");
    const toggleBtn = document.getElementById("toggle-roulette");
    const refreshBtn = document.getElementById("btn-refresh-roulette");
    const closeWinnerBtn = document.getElementById("close-winner-display");
    if (spinBtn && !spinBtn.dataset.listener) {
      spinBtn.addEventListener("click", () => this.spin());
      spinBtn.dataset.listener = "true";
    }
    if (toggleBtn && !toggleBtn.dataset.listener) {
      toggleBtn.addEventListener("click", () => this.toggleEntries());
      toggleBtn.dataset.listener = "true";
    }
    if (refreshBtn && !refreshBtn.dataset.listener) {
      refreshBtn.addEventListener("click", () => {
        this.loadChatters();
        UI.showToast(RouletteMessages.updatedRaw, "success", "fa-check");
      });
      refreshBtn.dataset.listener = "true";
    }
    if (closeWinnerBtn && !closeWinnerBtn.dataset.listener) {
      closeWinnerBtn.addEventListener("click", () => {
        document.getElementById("roulette-winner-display")?.classList.add("hidden");
      });
      closeWinnerBtn.dataset.listener = "true";
    }
    this.drawEmptyWheel();
  },
  toggleEntries() {
    this.isOpen = !this.isOpen;
    const btn = document.getElementById("toggle-roulette");
    if (btn) {
      btn.className = this.isOpen ? "btn-icon btn-warning" : "btn-icon btn-success";
      btn.innerHTML = this.isOpen ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    }
    if (this.isOpen) {
      UI.showToast(RouletteMessages.openRaw, "success", "fa-door-open");
      this.loadChatters();
      this.connectTmi();
    } else {
      UI.showToast(RouletteMessages.closedRaw, "warning", "fa-door-closed");
      TmiService.disconnect();
      this.isConnected = false;
    }
  },
  async connectTmi() {
    if (this.isConnected) return;
    if (!this.session) return;
    const auth = this.session.token ? {
      username: this.session.login,
      token: this.session.token
    } : void 0;
    try {
      await TmiService.connect(this.session.login, auth);
      this.isConnected = true;
      TmiService.addListener(
        "roulette",
        (_channel, tags, _message) => {
          if (this.isSpinning || !this.isOpen) return;
          const login = tags.username;
          if (IGNORED_BOTS.has(login.toLowerCase())) return;
          if (!this.chatters.some(
            (u) => u.user_login.toLowerCase() === login.toLowerCase()
          )) {
            this.chatters.push({
              user_login: login,
              user_name: tags["display-name"] || login
            });
            this.updateUI();
            this.pulseCounter();
          }
        }
      );
    } catch (err) {
      console.error("Roulette TMI Error:", err);
      UI.showToast(Messages.Common.connectionError || "Error connecting to chat", "error");
      this.toggleEntries();
    }
  },
  pulseCounter() {
    const countDisplay = document.getElementById("roulette-count");
    if (countDisplay) {
      countDisplay.classList.add("count-pulse");
      setTimeout(() => countDisplay.classList.remove("count-pulse"), 500);
    }
  },
  updateUI() {
    const countDisplay = document.getElementById("roulette-count");
    if (countDisplay) countDisplay.textContent = String(this.chatters.length);
    this.drawRouletteWheel();
  },
  loadChatters() {
    if (!this.session) return;
    const { apiKey, token, login, displayName } = this.session;
    const existing = new Set(this.chatters.map((u) => u.user_login));
    let added = 0;
    if (!existing.has(login)) {
      this.chatters.push({
        user_login: login,
        user_name: displayName || login
      });
      existing.add(login);
      added++;
    }
    if (added > 0) {
      this.updateUI();
    }
    const tokenParam = apiKey ? `apiKey=${encodeURIComponent(apiKey)}` : token ? `token=${encodeURIComponent(token)}` : "";
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API_ENDPOINTS.CHATTERS}?channel=${login}&${tokenParam}`, { headers }).then((res) => res.json()).then((data) => {
      const safeData = data;
      const chattersList = Array.isArray(safeData) ? safeData : safeData.chatters || [];
      if (Array.isArray(chattersList)) {
        const currentChatters = new Set(
          this.chatters.map((u) => u.user_login.toLowerCase())
        );
        let newAdded = 0;
        const typedList = chattersList;
        typedList.forEach((item) => {
          const login2 = typeof item === "string" ? item : item.user_login;
          const name = typeof item === "string" ? item : item.user_name;
          if (!login2) return;
          const lowerLogin = login2.toLowerCase();
          if (!currentChatters.has(lowerLogin) && !IGNORED_BOTS.has(lowerLogin)) {
            this.chatters.push({ user_login: login2, user_name: name });
            currentChatters.add(lowerLogin);
            newAdded++;
          }
        });
        if (newAdded > 0) {
          this.updateUI();
          this.pulseCounter();
        }
      }
    }).catch((err) => {
      console.error("Error loading chatters:", err);
      UI.showToast("Error al cargar usuarios del chat", "error");
    });
  },
  spin() {
    if (this.isSpinning || this.chatters.length === 0) return;
    this.isSpinning = true;
    this.spinAngleStart = Math.random() * 10 + 10;
    this.spinTime = 0;
    this.spinTimeTotal = Math.random() * 3e3 + 4e3;
    this.rotateWheel();
  },
  rotateWheel() {
    this.spinTime += 20;
    if (this.spinTime >= this.spinTimeTotal) {
      this.stopRotateWheel();
      return;
    }
    const spinAngle = this.spinAngleStart - this.easeOut(this.spinTime, 0, this.spinAngleStart, this.spinTimeTotal);
    this.startAngle += spinAngle * Math.PI / 180;
    this.drawRouletteWheel();
    this.spinTimeout = requestAnimationFrame(() => this.rotateWheel());
  },
  stopRotateWheel() {
    if (this.spinTimeout) cancelAnimationFrame(this.spinTimeout);
    this.isSpinning = false;
    const degrees = this.startAngle * 180 / Math.PI % 360;
    const arcd = 360 / this.chatters.length;
    const index = Math.floor((360 - (degrees + 90) % 360) % 360 / arcd);
    const winner = this.chatters[index % this.chatters.length];
    this.showWinner(winner);
  },
  easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  },
  showWinner(winner) {
    const display = document.getElementById("roulette-winner-display");
    const nameEl = document.getElementById("winner-name");
    if (display && nameEl) {
      const count = this.chatters.length;
      const safeName = UI.escapeHTML(winner.user_name);
      nameEl.innerHTML = RouletteMessages.winner(safeName, count);
      display.classList.remove("hidden");
      UI.showToast(RouletteMessages.winner(safeName, count), "success", "fa-trophy");
      if (this.session && this.session.login && this.session.token) {
        TmiService.sendMessage(
          this.session.login,
          `\u{1F3C6} \xA1El ganador es @${winner.user_name}! (De ${count} participantes) \xA1Felicidades! \u{1F389}`
        );
      }
    }
  },
  drawRouletteWheel() {
    if (!this.canvas || !this.ctx) return;
    const outsideRadius = 200;
    const textRadius = 160;
    const insideRadius = 50;
    this.ctx.clearRect(0, 0, 500, 500);
    const len = this.chatters.length;
    if (len === 0) {
      this.drawEmptyWheel();
      return;
    }
    this.arc = Math.PI * 2 / len;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    for (let i = 0; i < len; i++) {
      const angle = this.startAngle + i * this.arc;
      this.ctx.fillStyle = this.colors[i % this.colors.length];
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, outsideRadius, angle, angle + this.arc, false);
      this.ctx.arc(cx, cy, insideRadius, angle + this.arc, angle, true);
      this.ctx.stroke();
      this.ctx.fill();
      this.ctx.save();
      this.ctx.shadowOffsetX = -1;
      this.ctx.shadowOffsetY = -1;
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = "white";
      this.ctx.font = "bold 14px Poppins, sans-serif";
      this.ctx.translate(
        cx + Math.cos(angle + this.arc / 2) * textRadius,
        cy + Math.sin(angle + this.arc / 2) * textRadius
      );
      this.ctx.rotate(angle + this.arc / 2 + Math.PI / 2);
      const text = this.chatters[i].user_name;
      this.ctx.fillText(text, -this.ctx.measureText(text).width / 2, 0);
      this.ctx.restore();
    }
  },
  drawEmptyWheel() {
    if (!this.canvas || !this.ctx) return;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.ctx.clearRect(0, 0, 500, 500);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 200, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#1a1625";
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "#9146ff";
    this.ctx.stroke();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 22px Poppins, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = "#9146ff";
    this.ctx.fillText("Esperando", cx, cy - 10);
    this.ctx.fillText("Participantes...", cx, cy + 22);
    this.ctx.shadowBlur = 0;
  }
};
export {
  RouletteModule
};
