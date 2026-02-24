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

// frontend/config.ts
var protocol, host, API_BASE, CONFIG;
var init_config = __esm({
  "frontend/config.ts"() {
    "use strict";
    protocol = window.location.protocol;
    host = window.location.host;
    API_BASE = "/api/twitch";
    CONFIG = {
      domain: host,
      siteUrl: `${protocol}//${host}`,
      API_URL: API_BASE,
      twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`
    };
    Object.freeze(CONFIG);
  }
});

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

// frontend/core/auth.ts
var auth_exports = {};
__export(auth_exports, {
  Auth: () => Auth
});
var Auth;
var init_auth = __esm({
  "frontend/core/auth.ts"() {
    "use strict";
    init_config();
    Auth = {
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
  }
});

// frontend/shared/i18n/messages.ts
var messages_exports = {};
__export(messages_exports, {
  Messages: () => Messages
});
var Messages;
var init_messages = __esm({
  "frontend/shared/i18n/messages.ts"() {
    "use strict";
    Messages = {
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
  }
});

// frontend/features/dashboard/dashboard-config.ts
var API_BASE2, DASHBOARD_CONFIG;
var init_dashboard_config = __esm({
  "frontend/features/dashboard/dashboard-config.ts"() {
    "use strict";
    API_BASE2 = "/api/twitch";
    DASHBOARD_CONFIG = {
      API_ENDPOINTS: {
        BASE: API_BASE2,
        MAGIC8: `${API_BASE2}/minigames/magic8`,
        ANALYTICS: `${API_BASE2}/dashboard/analytics`,
        REGENERATE_KEY: `${API_BASE2}/system/regenerate-key`,
        FEEDBACK: `${API_BASE2}/system/feedback`,
        CHATTERS: `${API_BASE2}/dashboard/chatters`,
        USER_INFO: `${API_BASE2}/dashboard/user-info`,
        SEND_MESSAGE: `${API_BASE2}/send-message`,
        CLIPS: `${API_BASE2}/dashboard/get-clips`,
        ACTIVITY: `${API_BASE2}/dashboard/activity`,
        CLEAR_DATA: `${API_BASE2}/dashboard/clear-data`,
        DELETE_ACCOUNT: `${API_BASE2}/dashboard/delete-account`,
        HEALTH: `/api/twitch/system/health`,
        DUEL: `${API_BASE2}/minigames/duel`
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

// frontend/shared/i18n/authMessages.ts
var AuthMessages;
var init_authMessages = __esm({
  "frontend/shared/i18n/authMessages.ts"() {
    "use strict";
    AuthMessages = {
      sessionExpired: "Tu sesi\xF3n ha expirado",
      validationError: "Error al validar sesi\xF3n",
      sessionError: "Error de sesi\xF3n. Recarga la p\xE1gina.",
      expiredTitle: "Sesi\xF3n Expirada",
      expiredMsg: "Tu credencial ha caducado. Por favor, inicia sesi\xF3n de nuevo.",
      reloginBtn: '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesi\xF3n',
      expired: "Sesi\xF3n expirada. Por favor, inicia sesi\xF3n de nuevo."
    };
  }
});

// frontend/features/dashboard/trends/messages.ts
var TrendsMessages, TrackerMessages;
var init_messages2 = __esm({
  "frontend/features/dashboard/trends/messages.ts"() {
    "use strict";
    TrendsMessages = {
      title: /* @__PURE__ */ __name((channel) => `Tendencias de ${channel}`, "title"),
      noTmi: "TMI.js no cargado"
    };
    TrackerMessages = {
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
  }
});

// frontend/services/tmiService.ts
var TmiService;
var init_tmiService = __esm({
  "frontend/services/tmiService.ts"() {
    "use strict";
    init_auth();
    init_ui();
    init_authMessages();
    TmiService = {
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
  }
});

// frontend/features/dashboard/trends/templates.ts
var TrendsTemplates;
var init_templates = __esm({
  "frontend/features/dashboard/trends/templates.ts"() {
    "use strict";
    init_ui();
    TrendsTemplates = {
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
  }
});

// frontend/features/dashboard/trends/module.ts
var module_exports = {};
__export(module_exports, {
  TrendsModule: () => TrendsModule
});
var IGNORED_BOTS, TrendsModule;
var init_module = __esm({
  "frontend/features/dashboard/trends/module.ts"() {
    "use strict";
    init_messages();
    init_messages2();
    init_dashboard_config();
    init_ui();
    init_tmiService();
    init_templates();
    ({ IGNORED_BOTS } = DASHBOARD_CONFIG);
    TrendsModule = {
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
  }
});

// frontend/shared/i18n/profileMessages.ts
var ProfileMessages;
var init_profileMessages = __esm({
  "frontend/shared/i18n/profileMessages.ts"() {
    "use strict";
    ProfileMessages = {
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
  }
});

// frontend/shared/utils/profileTemplates.ts
var ProfileTemplates;
var init_profileTemplates = __esm({
  "frontend/shared/utils/profileTemplates.ts"() {
    "use strict";
    init_profileMessages();
    init_ui();
    ProfileTemplates = {
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
  }
});

// frontend/shared/utils/profileModal.ts
var profileModal_exports = {};
__export(profileModal_exports, {
  ProfileModal: () => ProfileModal
});
var ProfileModal;
var init_profileModal = __esm({
  "frontend/shared/utils/profileModal.ts"() {
    "use strict";
    init_profileMessages();
    init_profileTemplates();
    ProfileModal = {
      open(user) {
        const overlay = document.getElementById("profile-modal-overlay");
        const content = document.getElementById("profile-modal-content");
        if (!overlay || !content) return;
        const ageText = this.calculateAge(user.created_at);
        content.innerHTML = ProfileTemplates.renderContent(user, ageText);
        const logBtn = document.getElementById("view-logs-btn");
        if (logBtn) {
          logBtn.onclick = () => this.showUserLogs(user.login);
        }
        overlay.classList.add("active");
        const closeBtn = document.getElementById("close-modal-btn");
        if (closeBtn) {
          closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.close();
          };
        }
        if (!overlay.dataset.listener) {
          overlay.onclick = (e) => {
            if (e.target === overlay) this.close();
          };
          overlay.dataset.listener = "true";
        }
        const modalCard = content.parentElement;
        if (modalCard) {
          modalCard.onclick = (e) => e.stopPropagation();
        }
      },
      close() {
        const overlay = document.getElementById("profile-modal-overlay");
        if (overlay) overlay.classList.remove("active");
      },
      calculateAge(dateStr) {
        const createdDate = new Date(dateStr);
        const now = /* @__PURE__ */ new Date();
        const diffYears = now.getFullYear() - createdDate.getFullYear();
        const diffMonths = now.getMonth() - createdDate.getMonth();
        if (diffYears > 0) return ProfileMessages.years(diffYears);
        if (diffMonths > 1) return ProfileMessages.months(diffMonths);
        return ProfileMessages.new;
      },
      async showUserLogs(login) {
        const bioEl = document.getElementById("modal-bio");
        if (bioEl) {
          bioEl.innerHTML = `<div class="loading-logs"><i class="fa-solid fa-spinner fa-spin"></i> Cargando historial...</div>`;
        }
        const module = await Promise.resolve().then(() => (init_module(), module_exports));
        const logs = module.TrendsModule.getMessagesByUser(login);
        if (bioEl) {
          bioEl.innerHTML = ProfileTemplates.renderLogs(logs);
        }
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

// frontend/features/dashboard/account/dataExporter.ts
var dataExporter_exports = {};
__export(dataExporter_exports, {
  DataExport: () => DataExport
});
var COMMAND_INTEGRATIONS, DataExport;
var init_dataExporter = __esm({
  "frontend/features/dashboard/account/dataExporter.ts"() {
    "use strict";
    init_ui();
    init_dashboard_config();
    COMMAND_INTEGRATIONS = [
      {
        id: "clips",
        label: "\u{1F3AC} Buscador de Clips",
        description: "Busca el clip m\xE1s popular o reciente del canal",
        variants: [
          {
            name: "Clip Directo (URL)",
            params: "channel=$(channel)",
            desc: "Obtiene \xFAnicamente el link del clip"
          },
          {
            name: "Clip con Mensaje Personalizado",
            params: "channel=$(channel)&template=Mir\xE1%20este%20clip%20\xE9pico:%20{url}",
            desc: "Devuelve un texto incluyendo el link del clip"
          }
        ]
      },
      {
        id: "followage",
        label: "\u231B Followage (Tiempo de Seguimiento)",
        description: "Muestra cu\xE1nto tiempo lleva alguien siguiendo",
        variants: [
          {
            name: "Texto por Defecto",
            params: "channel=$(channel)&user=$(touser)",
            desc: "Texto est\xE1ndar de la API"
          },
          {
            name: "Plantilla Personalizada",
            params: "channel=$(channel)&user=$(touser)&template={user}%20lleva%20{time}%20bancando%20a%20{channel}",
            desc: "Personaliza tu propia respuesta ({time}, {user}, {channel})"
          }
        ]
      },
      {
        id: "so",
        label: "\u{1F4E2} Shoutout (Promoci\xF3n)",
        description: "Promociona a otro streamer en el chat",
        variants: [
          {
            name: "Shoutout Est\xE1ndar",
            params: "channel=$(channel)&touser=$(touser)",
            desc: "Muestra la \xFAltima categor\xEDa y enlace del streamer"
          },
          {
            name: "Shoutout Personalizado",
            params: "channel=$(channel)&touser=$(touser)&template=Vayan%20a%20seguir%20a%20{user},%20estuvo%20jugando%20{game}!%20{url}",
            desc: "Plantilla a medida ({user}, {game}, {url})"
          }
        ]
      },
      {
        id: "magic8",
        label: "\u{1F3B1} Bola 8 M\xE1gica",
        description: "Responde preguntas con la IA de LosPerris",
        variants: [
          {
            name: "Bola 8 Cl\xE1sica",
            params: "question=$(query)&user=$(user)&mood=classic",
            desc: "Respuestas solemnes y m\xEDsticas"
          },
          {
            name: "Bola 8 Sarc\xE1stica",
            params: "question=$(query)&user=$(user)&mood=sarcastic",
            desc: "Respuestas c\xEDnicas y condescendientes"
          },
          {
            name: "Bola 8 T\xF3xica",
            params: "question=$(query)&user=$(user)&mood=toxic",
            desc: "Respuestas posesivas y manipuladoras"
          },
          {
            name: "Bola 8 Amable",
            params: "question=$(query)&user=$(user)&mood=helpful",
            desc: "Respuestas dulces y motivacionales"
          }
        ]
      },
      {
        id: "russian",
        label: "\u{1F52B} Ruleta Rusa",
        description: "Un minijuego de riesgo de baneo/timeout",
        variants: [
          {
            name: "Modo Normal (Chat)",
            params: "channel=$(channel)&user=$(user)",
            desc: "Juego de texto, ideal para que el bot responda directamente"
          },
          {
            name: "Modo Hardcore",
            params: "channel=$(channel)&user=$(user)&hardcore=true",
            desc: "Aumenta las probabilidades de fallar"
          },
          {
            name: "Silencioso (Para Action/JSON)",
            params: "channel=$(channel)&user=$(user)&format=json",
            desc: "Devuelve un objeto JSON para bots avanzados"
          }
        ]
      },
      {
        id: "duel",
        label: "\u2694\uFE0F Duelo 1v1",
        description: "Peleas a muerte entre dos espectadores",
        variants: [
          {
            name: "Duelo Est\xE1ndar",
            params: "challenger=$(user)&target=$(touser)",
            desc: "Enfrenta al usuario actual contra quien mencione"
          }
        ]
      },
      {
        id: "roulette",
        label: "\u{1F3B0} Ruleta Casino",
        description: "Minijuego de suerte",
        variants: [
          {
            name: "Jugar Ruleta",
            params: "channel=$(channel)&user=$(user)",
            desc: "Apuestas de suerte est\xE1ndar"
          }
        ]
      }
    ];
    DataExport = {
      async fetchAnalytics(session) {
        try {
          const authQuery = session.apiKey ? `apiKey=${encodeURIComponent(session.apiKey)}` : session.token ? `token=${encodeURIComponent(session.token)}` : "";
          const headers = {};
          if (session.token) headers.Authorization = `Bearer ${session.token}`;
          const queryParam = authQuery ? `?${authQuery}` : "";
          const res = await fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS}${queryParam}`, {
            headers
          });
          if (res.ok) return await res.json();
        } catch (error) {
          console.error("[DataExport] Error fetching analytics:", error);
        }
        return {};
      },
      async fetchUserInfo(session) {
        try {
          const authQuery = session.apiKey ? `apiKey=${encodeURIComponent(session.apiKey)}` : session.token ? `token=${encodeURIComponent(session.token)}` : "";
          const headers = {};
          if (session.token) headers.Authorization = `Bearer ${session.token}`;
          const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${encodeURIComponent(session.login)}&${authQuery}`;
          const res = await fetch(url, { headers });
          if (res.ok) return await res.json();
        } catch (error) {
          console.error("[DataExport] Error fetching user info:", error);
        }
        return {
          followers: "---",
          broadcaster_type: "---",
          created_at: "---",
          description: "---",
          rateLimit: 120
        };
      },
      maskKey(key) {
        if (key.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
        return key.slice(0, 4) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + key.slice(-4);
      },
      getApiBaseUrl() {
        const { protocol: protocol2, host: host2 } = window.location;
        if (host2.includes("localhost") || host2.includes("127.0.0.1")) {
          return "https://api.losperris.com/api/twitch";
        }
        return `${protocol2}//${host2}/api/twitch`;
      },
      buildCommandRows(analytics, apiKey) {
        const rows = [];
        const apiBaseUrl = this.getApiBaseUrl();
        for (const cmd of COMMAND_INTEGRATIONS) {
          const count = analytics[cmd.id] || 0;
          const countStr = typeof count === "number" ? count.toLocaleString() : count;
          const getPath = /* @__PURE__ */ __name((id) => {
            const paths = {
              clips: "/dashboard/get-clips",
              followage: "/followage",
              so: "/shoutout",
              magic8: "/minigames/magic8",
              russian: "/minigames/russian",
              duel: "/minigames/duel",
              roulette: "/minigames/roulette"
            };
            return paths[id] || `/${id}`;
          }, "getPath");
          const path = getPath(cmd.id);
          let variantsHtml = "";
          for (const variant of cmd.variants) {
            const fullUrl = `${apiBaseUrl}${path}?${variant.params}&apiKey=${apiKey}`;
            variantsHtml += `
                    <div class="variant-box">
                        <div class="v-header">
                            <span class="v-name">${variant.name}</span>
                            <span class="v-desc">${variant.desc}</span>
                        </div>
                        <div class="bot-syntax-grid">
                            <div class="bot-syntax">
                                <span class="bot-name">Nightbot</span>
                                <div class="code-block">$(urlfetch ${fullUrl})</div>
                            </div>
                            <div class="bot-syntax">
                                <span class="bot-name">StreamElements</span>
                                <div class="code-block">\${customapi.${fullUrl}}</div>
                            </div>
                        </div>
                    </div>
                `;
          }
          rows.push(`
                <div class="command-card">
                    <div class="cmd-header">
                        <div class="cmd-title">
                            <h3>${cmd.label}</h3>
                            <p>${cmd.description}</p>
                        </div>
                        <div class="cmd-stat">
                            <span class="s-val">${countStr}</span>
                            <span class="s-lbl">USOS</span>
                        </div>
                    </div>
                    <div class="cmd-variants">
                        ${variantsHtml}
                    </div>
                </div>
            `);
        }
        return rows.join("");
      },
      async export(session) {
        const user = session;
        const name = user.displayName || user.login || "Usuario";
        const now = /* @__PURE__ */ new Date();
        const dateStr = now.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        const timeStr = now.toLocaleTimeString("es-ES");
        const userInfo = await this.fetchUserInfo(session);
        const analytics = await this.fetchAnalytics(session);
        const apiKey = user.apiKey || user.token || "";
        const maskedKey = this.maskKey(apiKey);
        const todayRequests = analytics.todayRequests ?? 0;
        const totalRequests = analytics.totalRequests ?? 0;
        const averageLatency = analytics.averageLatency ?? "0ms";
        const successRate = analytics.successRate ?? "100%";
        const channelType = userInfo.broadcaster_type === "partner" ? "Partner" : userInfo.broadcaster_type === "affiliate" ? "Afiliado" : "Est\xE1ndar";
        const followerCount = typeof userInfo.followers === "number" ? userInfo.followers.toLocaleString() : userInfo.followers;
        const createdAtDate = new Date(userInfo.created_at || now);
        const createdAtStr = isNaN(createdAtDate.getTime()) ? "---" : createdAtDate.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        const commandRows = this.buildCommandRows(analytics, apiKey);
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Datos \u2014 LosPerris API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0e0e12; color: #e0e0e8; min-height: 100vh; padding: 2rem; }
        .container { max-width: 720px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #2a2a35; }
        .header h1 { font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.3rem; }
        .header p { color: #9090a0; font-size: 0.85rem; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #7c3aed; margin: 0 auto 1rem; display: block; object-fit: cover; }
        .section { background: #16161d; border: 1px solid #2a2a35; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.2rem; }
        .section-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: #7c3aed; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .section-title::before { content: ''; width: 3px; height: 14px; background: #7c3aed; border-radius: 2px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #1e1e28; }
        .row:last-child { border-bottom: none; }
        .row .label { color: #9090a0; font-size: 0.85rem; font-weight: 500; }
        .row .value { color: #e0e0e8; font-size: 0.85rem; font-weight: 600; text-align: right; max-width: 60%; word-break: break-all; }
        .badge { display: inline-block; background: #7c3aed22; color: #a78bfa; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        .masked { font-family: monospace; letter-spacing: 1px; color: #9090a0; }
        
        /* Command Cards Styles */
        .commands-container { display: flex; flex-direction: column; gap: 1.2rem; }
        .command-card { background: #1a1a24; border: 1px solid #2a2a35; border-radius: 10px; overflow: hidden; }
        .cmd-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; border-bottom: 1px solid #2a2a35; background: #1c1c28;}
        .cmd-title h3 { font-size: 1.1rem; color: #fff; margin-bottom: 0.2rem; font-weight: 600; }
        .cmd-title p { font-size: 0.8rem; color: #9090a0; }
        .cmd-stat { display: flex; flex-direction: column; align-items: flex-end; }
        .cmd-stat .s-val { font-size: 1.4rem; font-weight: 700; color: #a78bfa; line-height: 1; }
        .cmd-stat .s-lbl { font-size: 0.65rem; color: #7a7a8a; letter-spacing: 1px; margin-top: 0.2rem; }
        .cmd-variants { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .variant-box { background: #15151e; border: 1px solid #252530; border-radius: 8px; padding: 0.8rem; }
        .v-header { margin-bottom: 0.6rem; display: flex; flex-direction: column; }
        .v-name { font-size: 0.85rem; font-weight: 600; color: #e0e0e8; }
        .v-desc { font-size: 0.75rem; color: #7a7a8a; margin-top: 0.2rem; }
        .bot-syntax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 0.8rem; }
        .bot-syntax { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
        .bot-name { font-size: 0.75rem; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .code-block { background: #0a0a0f; color: #a78bfa; font-family: monospace; font-size: 0.8rem; padding: 0.8rem; border-radius: 6px; border: 1px solid #2a2a35; word-wrap: break-word; overflow-x: auto; white-space: pre-wrap; user-select: all; }
        @media(max-width: 600px) { .bot-syntax-grid { grid-template-columns: 1fr; } }
        
        .footer { text-align: center; margin-top: 2rem; padding-top: 1.2rem; border-top: 1px solid #2a2a35; color: #5a5a6a; font-size: 0.75rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${user.profile_image_url ? `<img src="${user.profile_image_url}" alt="Avatar" class="avatar">` : ""}
            <h1>${name}</h1>
            <p>Reporte de datos personales \u2014 LosPerris API</p>
        </div>

        <div class="section">
            <div class="section-title">Informaci\xF3n de Perfil</div>
            <div class="row"><span class="label">Nombre</span><span class="value">${name}</span></div>
            <div class="row"><span class="label">Login</span><span class="value">@${user.login || "---"}</span></div>
            <div class="row"><span class="label">ID de Usuario</span><span class="value">${user.userId || "---"}</span></div>
            <div class="row"><span class="label">Tipo de Canal</span><span class="value"><span class="badge">${channelType}</span></span></div>
            <div class="row"><span class="label">Seguidores</span><span class="value">${followerCount}</span></div>
            <div class="row"><span class="label">Miembro Desde</span><span class="value">${createdAtStr}</span></div>
            <div class="row"><span class="label">Biograf\xEDa</span><span class="value">${userInfo.description || "---"}</span></div>
        </div>

        <div class="section">
            <div class="section-title">Seguridad y Acceso</div>
            <div class="row"><span class="label">API Key</span><span class="value masked">${maskedKey}</span></div>
            <div class="row"><span class="label">Estado</span><span class="value"><span class="badge">Activa</span></span></div>
            <div class="row"><span class="label">L\xEDmite de Peticiones</span><span class="value">${userInfo.rateLimit || 120}</span></div>
            <div class="row"><span class="label">Nivel de Acceso</span><span class="value">Full API</span></div>
        </div>

        <div class="section">
            <div class="section-title">M\xE9tricas Generales</div>
            <div class="row"><span class="label">Peticiones Hoy</span><span class="value">${todayRequests}</span></div>
            <div class="row"><span class="label">Peticiones Totales</span><span class="value">${totalRequests}</span></div>
            <div class="row"><span class="label">Latencia Promedio</span><span class="value">${averageLatency}</span></div>
            <div class="row"><span class="label">Tasa de \xC9xito</span><span class="value">${successRate}</span></div>
        </div>

        <div class="section">
            <div class="section-title">Integraciones de Comandos</div>
            <div class="commands-container">
                ${commandRows || '<p style="text-align:center;color:#7a7a8a;margin-top:1rem">A\xFAn no hay comandos registrados.</p>'}
            </div>
        </div>

        <div class="footer">
            <p>Exportado el ${dateStr} a las ${timeStr}</p>
            <p style="margin-top: 0.3rem">LosPerris API \u2014 Reporte generado autom\xE1ticamente</p>
        </div>
    </div>
</body>
</html>`;
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `MisDatos_LosPerrisAPI_${user.login || "usuario"}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        UI.showToast("Archivo descargado correctamente", "success");
      }
    };
  }
});

// frontend/app-dashboard.ts
init_auth();
init_ui();

// frontend/shared/utils/htmlLoader.ts
var HtmlLoader = {
  cache: /* @__PURE__ */ new Map(),
  async load(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.dataset.loaded === "true") return;
    try {
      let html = "";
      if (this.cache.has(url)) {
        html = this.cache.get(url);
      } else {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        html = await res.text();
        this.cache.set(url, html);
      }
      container.innerHTML = html;
      container.dataset.loaded = "true";
      document.dispatchEvent(
        new CustomEvent("html-loaded", { detail: { url, containerId } })
      );
    } catch (error) {
      console.error("[HtmlLoader] Error:", error);
      const { Messages: Messages2 } = await Promise.resolve().then(() => (init_messages(), messages_exports));
      container.innerHTML = `<div class="error-state">${Messages2.Common.errorLoadingUI(url)}</div>`;
    }
  }
};

// frontend/features/dashboard/home.ts
init_dashboard_config();
init_loader();
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

// frontend/features/dashboard/commands/module.ts
init_config();
init_dashboard_config();

// frontend/features/dashboard/commands/messages.ts
var CommandsMessages = {
  clipResponse: /* @__PURE__ */ __name((user, url) => `\u{1F3AC} Clip creado por ${user}: ${url}`, "clipResponse"),
  followageResponse: "Procesando followage...",
  missingCreds: "Faltan credenciales",
  completeFields: "\u26A0\uFE0F Por favor, ingresa el Canal y el Usuario para probar.",
  testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
  connectionError: '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexi\xF3n</span>',
  success: /* @__PURE__ */ __name((text) => `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`, "success"),
  error: /* @__PURE__ */ __name((text) => `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`, "error"),
  form: {
    customMessage: "Mensaje Personalizado (Opcional)",
    variables: "Variables:",
    selectBot: "Selecciona tu bot:",
    copyBtn: "Copiar"
  }
};

// frontend/shared/utils/commandGenerator.ts
var CommandGenerator = {
  masks: {
    apiKey: "**************",
    token: "**************"
  },
  bots: {
    nightbot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(urlfetch ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => {
        if (name === "user") return "$(touser)";
        if (name === "query") return "$(querystring)";
        return `$(${name})`;
      }, "arg")
    },
    streamelements: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(customapi ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => `\${${name}}`, "arg")
    },
    fossabot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(customapi ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => {
        if (name === "user") return "{{user.name}}";
        return `{{${name}}}`;
      }, "arg")
    },
    wizebot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(urlfetch ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => `$(arg_${name === "user" ? "1" : name})`, "arg")
    }
  },
  generate(botName, url, queryParams) {
    const bot = this.bots[botName] || this.bots.nightbot;
    const fullUrl = `${url}?${queryParams}`;
    return bot.urlfetch(fullUrl);
  },
  maskSecrets(cmd, secrets = {}) {
    let masked = cmd;
    if (secrets.apiKey) masked = masked.split(secrets.apiKey).join(this.masks.apiKey);
    if (secrets.token) masked = masked.split(secrets.token).join(this.masks.token);
    return masked;
  }
};

// frontend/features/dashboard/commands/config.ts
var COMMAND_CONFIG = {
  follow: {
    id: "follow",
    containerId: "command-card-followage",
    title: "Comando !followage",
    icon: "fa-solid fa-wrench",
    desc: "Muestra cu\xE1nto tiempo lleva alguien sigui\xE9ndote",
    info: "Genera el c\xF3digo para que tu bot responda con el tiempo exacto que un usuario te sigue.",
    templatePlaceholder: "Ej: {user} lleva sufriendo {time}.",
    templateVars: "Variables: {user}, {time}, {channel}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&user=${userArg}`;
      const cmd = CommandGenerator.generate(bot, `${domain}/followage`, queryParams);
      return {
        full: `!addcom !followage ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  clip: {
    id: "clip",
    containerId: "command-card-clip",
    title: "Comando !clip",
    icon: "fa-solid fa-video",
    desc: "Permite crear clips desde el chat",
    info: "Tus moderadores podr\xE1n crear clips instant\xE1neos escribiendo !clip. Requiere estar en vivo.",
    templatePlaceholder: "Ej: \xA1Miren este clip de {user}! \u{1F449} {url}",
    templateVars: "Variables: {user}, {url}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
      const userArg = bot === "nightbot" ? "$(user)" : bot === "wizebot" ? "$(user_name)" : "${user}";
      const titleArg = botUtils.arg("query") || botUtils.arg("args") || "";
      if (titleArg) queryParams += `&title=${titleArg}`;
      const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip`, queryParams);
      let cmd = "";
      if (templateVal) {
        cmd = templateVal.replace("{user}", userArg).replace("{url}", apiCall);
      } else {
        cmd = `\u{1F3AC} Clip creado por ${userArg}: ${apiCall}`;
      }
      return {
        full: `!addcom !clip ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  shoutout: {
    id: "shoutout",
    containerId: "command-card-shoutout",
    title: "Comando !so",
    icon: "fa-solid fa-bullhorn",
    desc: "Promociona a otro streamer",
    info: "Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.",
    templatePlaceholder: "Ej: Dale follow a {user}, jugando {game} \u{1F449} {url}",
    templateVars: "Variables disponibles: {user}, {game}, {url}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot];
      const targetArg = botUtils.arg("touser") || botUtils.arg("1");
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&touser=${targetArg}`;
      const cmd = CommandGenerator.generate(bot, `${domain}/shoutout`, queryParams);
      return {
        full: `!addcom !so ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  magic8: {
    id: "magic8",
    containerId: "command-card-magic8",
    title: "Comando !8ball",
    icon: "fa-solid fa-8",
    desc: "Comando para que tus viewers pregunten a la IA",
    info: "Genera el c\xF3digo para a\xF1adir el comando de la Bola 8 a tu bot de chat.",
    extraSelectors: [
      {
        id: "mood",
        label: "Personalidad",
        icon: "fa-solid fa-masks-theater",
        options: [
          { value: "classic", label: "Cl\xE1sica" },
          { value: "sarcastic", label: "Sarc\xE1stica" },
          { value: "toxic", label: "T\xF3xica" },
          { value: "helpful", label: "Servicial" }
        ]
      }
    ],
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams, extraValues) => {
      const botUtils = CommandGenerator.bots[bot];
      const mood = extraValues.mood || "classic";
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&mood=${mood}`;
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      queryParams += `&user=${userArg}`;
      const queryArg = botUtils.arg("query") || botUtils.arg("args") || "(?)";
      queryParams += `&question=${queryArg}`;
      const magicUrl = domain.includes("/minigames") ? `${domain}/magic8` : `${domain}/minigames/magic8`;
      const cmd = CommandGenerator.generate(bot, magicUrl, queryParams);
      return {
        full: `!addcom !8ball ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  russian: {
    id: "russian",
    containerId: "command-card-russian",
    title: "Comando !ruleta",
    icon: "fa-solid fa-skull-crossbones",
    desc: "Juego de Ruleta Rusa para el chat",
    info: "Tus viewers podr\xE1n jugar a la Ruleta Rusa escribiendo !ruleta. \xA1Cuidado con la bala!",
    extraSelectors: [
      {
        id: "hardcore",
        label: "Modo Hardcore",
        icon: "fa-solid fa-skull",
        options: [
          { value: "false", label: "Desactivado" },
          { value: "true", label: "Activado (60s timeout)" }
        ]
      }
    ],
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams, extraValues) => {
      const botUtils = CommandGenerator.bots[bot];
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      const isHardcore = extraValues.hardcore === "true";
      queryParams += `&user=${userArg}&hardcore=${isHardcore}`;
      const russianUrl = domain.includes("/minigames") ? `${domain}/russian` : `${domain}/minigames/russian`;
      const cmd = CommandGenerator.generate(bot, russianUrl, queryParams);
      return {
        full: `!addcom !ruleta ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  duel: {
    id: "duel",
    containerId: "command-card-duel",
    title: "Comando !duelo",
    icon: "fa-solid fa-khanda",
    desc: "Juego de Duelo 1vs1 para el chat",
    info: "Tus viewers podr\xE1n retarse a duelos narrativos escribiendo !duelo @usuario.",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot];
      const challengerArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      const targetArg = botUtils.arg("touser") || botUtils.arg("1");
      queryParams += `&challenger=${challengerArg}&target=${targetArg}`;
      const duelUrl = domain.includes("/minigames") ? `${domain}/duel` : `${domain}/minigames/duel`;
      const cmd = CommandGenerator.generate(bot, duelUrl, queryParams);
      return {
        full: `!addcom !duelo ${cmd}`,
        url: cmd
      };
    }, "generate")
  }
};

// frontend/features/dashboard/commands/templates.ts
var CommandTemplates = {
  generateCard(conf) {
    let extrasHTML = "";
    if (conf.extraSelectors) {
      conf.extraSelectors.forEach((sel) => {
        extrasHTML += `
                <div class="tool-selector mt-10">
                    <label><i class="${sel.icon}"></i> ${sel.label}:</label>
                    <select id="extra-${conf.id}-${sel.id}" class="select-input">
                        ${sel.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}
                    </select>
                </div>`;
      });
    }
    const templateSection = conf.templatePlaceholder ? `
            <div class="form-group mb-20">
                <label class="input-label">
                    <i class="fa-solid fa-pen-to-square"></i> ${CommandsMessages.form.customMessage}
                </label>
                <input type="text" id="${conf.id}-template" class="text-input full-width"
                    placeholder="${conf.templatePlaceholder}">
                <small class="input-help">
                    ${conf.templateVars ? conf.templateVars.replace("Variables:", `<strong class="text-accent">${CommandsMessages.form.variables}</strong>`).replace(/\{(\w+)\}/g, '<code class="var-badge">{$1}</code>') : ""}
                </small>
            </div>` : "";
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title-group">
                    <div class="card-icon">
                        <i class="${conf.icon}"></i>
                    </div>
                    <div>
                        <h3>${conf.title}</h3>
                        <p class="card-desc">${conf.desc}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <i class="fa-solid fa-circle-question info-icon" data-tooltip="${conf.info}"></i>
                </div>
            </div>
            <div class="card-body">
                <div class="tool-selector">
                    <label><i class="fa-solid fa-robot"></i> ${CommandsMessages.form.selectBot}</label>
                    <select id="bot-select-${conf.id}" class="select-input">
                        <option value="nightbot">Nightbot</option>
                        <option value="streamelements">StreamElements</option>
                        <option value="fossabot">Fossabot</option>
                        <option value="wizebot">Wizebot</option>
                    </select>
                </div>

                ${extrasHTML}
                ${templateSection}

                <div class="tool-selector">
                    <label><i class="fa-solid fa-file-code"></i> Formato de copiado:</label>
                    <select id="copy-format-${conf.id}" class="select-input">
                        <option value="full">Comando completo (!addcom)</option>
                        <option value="url">Solo URL</option>
                    </select>
                </div>

                <div class="code-box">
                    <textarea id="command-output-${conf.id}" readonly></textarea>
                    <button class="btn-copy copy-btn" data-target="command-output-${conf.id}">
                        <i class="fa-regular fa-copy"></i> ${CommandsMessages.form.copyBtn}
                    </button>
                </div>
            </div>
        </div>`;
  }
};

// frontend/features/dashboard/commands/module.ts
init_ui();
var { API_ENDPOINTS: API_ENDPOINTS2 } = DASHBOARD_CONFIG;
window.CommandUtils = { CommandGenerator };
var CommandsModule = {
  session: null,
  initialized: false,
  uiInitialized: false,
  async init(session) {
    this.session = session;
    if (!this.session) return;
    this.initialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.renderCommandCards();
      this.setupGenericCommands();
      this.setupTestCommand();
      this.uiInitialized = true;
    }
    Object.values(COMMAND_CONFIG).forEach((conf) => {
      this.updateCommand(conf);
    });
  },
  deactivate() {
  },
  renderCommandCards() {
    Object.values(COMMAND_CONFIG).forEach((conf) => {
      const config = conf;
      const container = document.getElementById(config.containerId);
      if (!container) return;
      container.innerHTML = CommandTemplates.generateCard(config);
    });
  },
  setupGenericCommands() {
    Object.values(COMMAND_CONFIG).forEach((conf) => {
      const config = conf;
      const botSelect = document.getElementById(`bot-select-${config.id}`);
      const output = document.getElementById(`command-output-${config.id}`);
      const templateInput = document.getElementById(`${config.id}-template`);
      const formatSelect = document.getElementById(`copy-format-${config.id}`);
      if (botSelect && output) {
        const updateFn = /* @__PURE__ */ __name(() => this.updateCommand(config), "updateFn");
        botSelect.addEventListener("change", updateFn);
        if (templateInput) templateInput.addEventListener("input", updateFn);
        if (formatSelect) formatSelect.addEventListener("change", updateFn);
        if (config.extraSelectors) {
          config.extraSelectors.forEach((sel) => {
            const selEl = document.getElementById(`extra-${config.id}-${sel.id}`);
            if (selEl) selEl.addEventListener("change", updateFn);
          });
        }
        updateFn();
      }
    });
  },
  updateCommand(conf) {
    const botSelect = document.getElementById(`bot-select-${conf.id}`);
    const output = document.getElementById(`command-output-${conf.id}`);
    const templateInput = document.getElementById(`${conf.id}-template`);
    const formatSelect = document.getElementById(`copy-format-${conf.id}`);
    if (!botSelect || !output) return;
    if (!this.session) return;
    const { login, apiKey, token } = this.session;
    const currentApiKey = apiKey || "";
    const bot = botSelect.value;
    const domain = `${CONFIG.siteUrl}${API_ENDPOINTS2.BASE}`;
    const tokenParam = apiKey ? `apiKey=${encodeURIComponent(apiKey)}` : token ? `token=${encodeURIComponent(token)}` : "";
    const templateVal = templateInput ? templateInput.value.trim() : "";
    const queryParams = `channel=${login}&${tokenParam}`;
    const extraValues = {};
    if (conf.extraSelectors) {
      conf.extraSelectors.forEach((sel) => {
        const selEl = document.getElementById(
          `extra-${conf.id}-${sel.id}`
        );
        if (selEl) extraValues[sel.id] = selEl.value;
      });
    }
    const result = conf.generate(
      domain,
      login,
      tokenParam,
      bot,
      templateVal,
      queryParams,
      extraValues
    );
    const format = formatSelect ? formatSelect.value : "full";
    const realCmd = format === "full" ? result.full : result.url;
    const maskedCmd = realCmd.split(currentApiKey).join("**************");
    output.value = maskedCmd;
    output.dataset.realValue = realCmd;
  },
  setupTestCommand() {
    const btn = document.getElementById("run-test-btn");
    if (!btn) return;
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", async () => {
      const channel = document.getElementById("test-channel").value.trim();
      const user = document.getElementById("test-user").value.trim();
      const resultBox = document.getElementById("test-result-container");
      const resultText = document.getElementById("test-result-text");
      if (!channel || !user) {
        resultBox.classList.add("active", "error");
        resultBox.classList.remove("success");
        resultText.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${CommandsMessages.completeFields}`;
        return;
      }
      resultBox.classList.add("active");
      resultBox.classList.remove("success", "error");
      resultText.innerHTML = CommandsMessages.testing;
      if (!this.session) return;
      const { apiKey, token } = this.session;
      const domain = `${window.location.origin}${API_ENDPOINTS2.BASE}`;
      const tokenParam = apiKey ? `apiKey=${encodeURIComponent(apiKey)}` : token ? `token=${encodeURIComponent(token)}` : "";
      const url = `${domain}/followage?user=${user}&channel=${channel}&${tokenParam}`;
      try {
        const response = await fetch(url);
        const text = await response.text();
        const safeText = UI.escapeHTML(text);
        if (response.ok) {
          resultBox.classList.add("success");
          resultText.innerHTML = `<i class="fa-solid fa-check"></i> ${safeText}`;
        } else {
          resultBox.classList.add("error");
          resultText.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${safeText}`;
        }
      } catch (err) {
        resultText.innerHTML = CommandsMessages.connectionError;
        console.error(err);
      }
    });
  }
};

// frontend/features/dashboard/clips.ts
init_ui();
init_messages();

// frontend/features/dashboard/clips/messages.ts
var ClipsMessages = {
  loading: '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clips...</div>',
  empty: `
        <div class="empty-state">
            <i class="fa-solid fa-film"></i>
            <p>No hay clips recientes</p>
        </div>
    `,
  loadError: "\u26A0\uFE0F Error al cargar clips"
};

// frontend/features/dashboard/clips.ts
init_authMessages();
init_dashboard_config();

// frontend/services/cacheService.ts
var CACHE_TTL = 6e4;
var _CacheService = class _CacheService {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
    setInterval(() => this.cleanup(), 6e4);
  }
  set(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    const now = Date.now();
    const age = now - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  has(key) {
    return this.get(key) !== null;
  }
  clear(key) {
    this.cache.delete(key);
  }
  clearAll() {
    this.cache.clear();
  }
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  getStats() {
    return {
      size: this.cache.size
    };
  }
};
__name(_CacheService, "CacheService");
var CacheService = _CacheService;
var cache = new CacheService();

// frontend/features/dashboard/clips.ts
var { API_ENDPOINTS: API_ENDPOINTS3 } = DASHBOARD_CONFIG;
var ClipsModule = {
  session: null,
  initialized: false,
  allClips: [],
  currentClips: [],
  favorites: [],
  observer: null,
  currentPage: 1,
  ITEMS_PER_PAGE: 20,
  cssLoaded: false,
  uiInitialized: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/clips.css");
      });
      this.cssLoaded = true;
    }
    this.loadFavorites();
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.classList.remove("lazy-img");
              observer.unobserve(img);
            }
          });
        },
        { rootMargin: "50px" }
      );
    }
    this.initialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.setupUI();
      this.uiInitialized = true;
    }
    if (this.allClips.length === 0) {
      this.loadClips();
    }
  },
  deactivate() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  loadFavorites() {
    if (!this.session) return;
    try {
      const saved = localStorage.getItem(`clips_favs_${this.session.userId}`);
      this.favorites = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading favorites", e);
      this.favorites = [];
    }
  },
  saveFavorites() {
    if (!this.session) return;
    try {
      localStorage.setItem(
        `clips_favs_${this.session.userId}`,
        JSON.stringify(this.favorites)
      );
    } catch (e) {
      console.error("Error saving favorites", e);
    }
  },
  toggleFavorite(clipId) {
    if (this.favorites.includes(clipId)) {
      this.favorites = this.favorites.filter((id) => id !== clipId);
      UI.showToast("Clip eliminado de favoritos", "info");
    } else {
      this.favorites.push(clipId);
      UI.showToast("Clip a\xF1adido a favoritos", "success");
    }
    this.saveFavorites();
    this.updateFavoriteBtn(clipId);
  },
  setupUI() {
    this.setupFilters();
    const refreshBtn = document.getElementById("refresh-clips-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadClips(true);
      });
    }
  },
  setupFilters() {
    const searchInput = document.getElementById("clips-search");
    const sortSelect = document.getElementById("clips-sort");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        this.debounce(() => {
          this.filterAndRender();
        }, 300)
      );
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        this.filterAndRender();
      });
    }
  },
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      const later = /* @__PURE__ */ __name(() => {
        clearTimeout(timeout);
        func(...args);
      }, "later");
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  async loadClips(forceRefresh = false) {
    const container = document.getElementById("clips-gallery");
    if (!container) return;
    if (!this.session) return;
    const cacheKey = `clips_${this.session.userId}`;
    if (!forceRefresh) {
      const cachedClips = cache.get(cacheKey);
      if (cachedClips) {
        this.allClips = cachedClips;
        this.filterAndRender();
        return;
      }
    }
    this.renderSkeleton(container);
    if (forceRefresh) UI.showToast("Actualizando clips...", "info");
    try {
      const { apiKey, token, login } = this.session;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const params = [`channel=${login}`];
      if (apiKey) params.push(`apiKey=${encodeURIComponent(apiKey)}`);
      else if (token) params.push(`token=${encodeURIComponent(token)}`);
      const url = `${API_ENDPOINTS3.CLIPS}?${params.join("&")}`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const isAuthError = response.status === 401 || response.status === 403;
        throw new Error(isAuthError ? "auth_error" : "fetch_error");
      }
      const data = await response.json();
      const clips = Array.isArray(data) ? data : data.clips || data.data || [];
      this.allClips = clips;
      if (clips.length > 0) {
        cache.set(cacheKey, clips, CACHE_TTL);
      }
      this.filterAndRender();
    } catch (error) {
      this.handleError(error, container);
    }
  },
  handleError(error, container) {
    const isAuthError = error.message === "auth_error";
    UI.showToast(isAuthError ? AuthMessages.expired : ClipsMessages.loadError, "error");
    if (isAuthError) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>${AuthMessages.expiredTitle}</h3>
                    <p>${AuthMessages.expiredMsg}</p>
                    <button id="relogin-clips-btn" class="btn-primary" style="margin-top:10px;">
                        ${AuthMessages.reloginBtn}
                    </button>
                </div>
            `;
      document.getElementById("relogin-clips-btn")?.addEventListener("click", () => {
        Promise.resolve().then(() => (init_auth(), auth_exports)).then((m) => m.Auth.relogin());
      });
    } else {
      container.innerHTML = Messages.Common.error(error.message);
      const retryBtn = document.getElementById("retry-clips-btn");
      if (retryBtn) retryBtn.onclick = () => this.loadClips();
    }
  },
  renderSkeleton(container) {
    container.innerHTML = Array(8).fill(0).map(
      () => `
            <div class="skeleton-card">
                <div class="skeleton-thumb skeleton"></div>
                <div class="skeleton-info">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-meta">
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                    </div>
                </div>
            </div>
        `
    ).join("");
  },
  filterAndRender() {
    const searchTerm = document.getElementById("clips-search")?.value.toLowerCase() || "";
    const sortValue = document.getElementById("clips-sort")?.value || "date-desc";
    const filtered = this.allClips.filter(
      (clip) => clip.title.toLowerCase().includes(searchTerm)
    );
    filtered.sort((a, b) => {
      switch (sortValue) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "views-desc":
          return b.view_count - a.view_count;
        case "views-asc":
          return a.view_count - b.view_count;
        default:
          return 0;
      }
    });
    this.currentClips = filtered;
    this.currentPage = 1;
    const clipsGallery = document.getElementById("clips-gallery");
    if (clipsGallery) clipsGallery.innerHTML = "";
    this.renderPage();
  },
  renderPage() {
    const clipsGallery = document.getElementById("clips-gallery");
    if (!clipsGallery) return;
    if (this.currentClips.length === 0) {
      clipsGallery.innerHTML = ClipsMessages.empty;
      return;
    }
    const loadMore = document.getElementById("clips-load-more");
    if (loadMore) loadMore.remove();
    const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
    const end = start + this.ITEMS_PER_PAGE;
    const pageClips = this.currentClips.slice(start, end);
    const fragment = document.createDocumentFragment();
    pageClips.forEach((clip) => {
      fragment.appendChild(this.buildCard(clip));
    });
    clipsGallery.appendChild(fragment);
    if (end < this.currentClips.length) {
      this.addLoadMoreButton(clipsGallery);
    }
  },
  addLoadMoreButton(container) {
    const btnContainer = document.createElement("div");
    btnContainer.id = "clips-load-more";
    btnContainer.className = "load-more-container";
    const btn = document.createElement("button");
    btn.className = "btn-secondary";
    btn.innerHTML = "Ver m\xE1s clips";
    btn.onclick = () => {
      this.currentPage++;
      this.renderPage();
    };
    btnContainer.appendChild(btn);
    container.after(btnContainer);
  },
  buildCard(clip) {
    const card = document.createElement("div");
    card.className = "clip-card fade-in";
    card.dataset.id = clip.id;
    const safeTitle = UI.escapeHTML(clip.title);
    const safeUrl = UI.escapeHTML(clip.url);
    const safeThumb = UI.escapeHTML(clip.thumbnail_url);
    const dateStr = new Date(clip.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    const viewsStr = clip.view_count.toLocaleString("es-ES");
    const isFav = this.favorites.includes(clip.id);
    const favIconClass = isFav ? "fa-solid fa-star" : "fa-regular fa-star";
    const favActiveClass = isFav ? "active" : "";
    card.innerHTML = `
            <div class="clip-actions">
                <button class="btn-clip-action fav-btn ${favActiveClass}" title="Favorito" data-id="${clip.id}">
                    <i class="${favIconClass}"></i>
                </button>
                <button class="btn-clip-action copy-btn" title="Copiar enlace" data-url="${safeUrl}">
                    <i class="fa-solid fa-link"></i>
                </button>
            </div>
            <a href="${safeUrl}" target="_blank" class="clip-link">
                <div class="clip-thumb-wrapper">
                    <img data-src="${safeThumb}" class="clip-thumb lazy-img" alt="${safeTitle}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5IiBzdHlsZT0iYmFja2dyb3VuZDojMjIyOyIvPgo=">
                </div>
                <div class="clip-info">
                    <div class="clip-title" title="${safeTitle}">${safeTitle}</div>
                    <div class="clip-meta">
                        <span><i class="fa-solid fa-eye"></i> ${viewsStr}</span>
                        <span>${dateStr}</span>
                    </div>
                </div>
            </a>
        `;
    const img = card.querySelector("img");
    if (this.observer && img) this.observer.observe(img);
    this.attachCardEvents(card, safeUrl, clip.id);
    return card;
  },
  attachCardEvents(card, url, clipId) {
    card.querySelector(".copy-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => {
        const btn = e.currentTarget;
        const icon = btn.querySelector("i");
        const originalClass = icon.className;
        icon.className = "fa-solid fa-check";
        UI.showToast("Enlace copiado", "success");
        setTimeout(() => {
          icon.className = originalClass;
        }, 2e3);
      });
    });
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFavorite(clipId);
    });
  },
  updateFavoriteBtn(clipId) {
    const card = document.querySelector(`.clip-card[data-id="${clipId}"]`);
    if (!card) return;
    const btn = card.querySelector(".fav-btn");
    if (!btn) return;
    const icon = btn.querySelector("i");
    const isFav = this.favorites.includes(clipId);
    if (isFav) {
      btn.classList.add("active");
      if (icon) icon.className = "fa-solid fa-star";
    } else {
      btn.classList.remove("active");
      if (icon) icon.className = "fa-regular fa-star";
    }
  }
};

// frontend/features/dashboard/trends.ts
init_module();

// frontend/features/dashboard/stalker/module.ts
init_ui();
init_messages();

// frontend/features/dashboard/stalker/messages.ts
var StalkerMessages = {
  loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando Chat...',
  empty: `
        <div class="empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>Nadie en el chat (o error de conexi\xF3n)</p>
        </div>
    `,
  waiting: `
        <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
        <h3>Esperando se\xF1al...</h3>
        <p>Dale al bot\xF3n <strong>Play</strong> para comenzar a escanear el chat.</p>
    `,
  syncNote: "* Lista sincronizada con API + Chat en vivo",
  reauthError: `
        <div class="error-msg" style="text-align: center; padding: 20px;">
            <i class="fa-solid fa-lock" style="font-size: 2rem; margin-bottom: 10px; color: var(--accent);"></i>
            <h3>Faltan Permisos</h3>
            <p>Para ver el chat, necesitas autorizar el acceso.</p>
            <button id="reauth-btn" class="btn-primary" style="margin-top: 10px;">
                <i class="fa-brands fa-twitch"></i> Conectar de nuevo
            </button>
        </div>
    `,
  userInfo: /* @__PURE__ */ __name((info) => `
        \u{1F464} ${info.display_name}
        \u{1F4C5} Creado: ${new Date(info.created_at).toLocaleDateString()}
        \u{1F441}\uFE0F Vistas: ${info.view_count}
        \u{1F4DD} Bio: ${info.description || "Sin bio"}
    `, "userInfo"),
  updated: '<i class="fa-solid fa-check"></i> Lista Stalker recargada',
  updatedRaw: "Lista Stalker recargada",
  bioEmpty: "Sin biograf\xEDa disponible.",
  apiError: "Error API",
  infoError: "No se pudo cargar info del usuario",
  reloginMsg: "Necesitas re-login (Permisos)",
  loadError: "No se pudo cargar info del usuario",
  scanStarted: '<i class="fa-solid fa-satellite-dish fa-beat" style="--fa-beat-scale: 1.2;"></i> Escaneo iniciado',
  scanStartedRaw: "Escaneo iniciado",
  scanPaused: '<i class="fa-solid fa-snowflake" style="color:#00f2ea"></i> Vista Congelada (Pausado)',
  scanPausedRaw: "Vista Congelada (Pausado)",
  tableHeaders: {
    avatar: "Avatar",
    user: "Usuario",
    login: "Login",
    action: "Acci\xF3n"
  },
  scanControls: {
    pause: "Pausar Escaneo",
    start: "Iniciar Escaneo",
    searchPlaceholder: "Buscar usuario...",
    refresh: "Recargar lista"
  },
  detectionNote: "* La detecci\xF3n de usuarios se basa en la actividad reciente del chat.",
  rowsLoading: "Cargando usuarios..."
};

// frontend/features/dashboard/stalker/module.ts
init_dashboard_config();
init_tmiService();

// frontend/features/dashboard/stalker/templates.ts
init_ui();
var StalkerTemplates = {
  renderMain() {
    return `
            <div id="stalker-loading" class="loading-state hidden">
                <i class="fa-solid fa-spinner fa-spin"></i> ${StalkerMessages.rowsLoading}
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">${StalkerMessages.tableHeaders.avatar}</th>
                            <th>${StalkerMessages.tableHeaders.user}</th>
                            <th>${StalkerMessages.tableHeaders.login}</th>
                            <th style="text-align: right;">${StalkerMessages.tableHeaders.action}</th>
                        </tr>
                    </thead>
                    <tbody id="stalker-grid">
                        <tr>
                            <td colspan="4">
                                <div id="stalker-empty" class="empty-state">
                                    ${StalkerMessages.waiting}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                ${StalkerMessages.detectionNote}
            </div>
        `;
  },
  renderControls(isScanning) {
    const btnClass = isScanning ? "btn-warning" : "btn-success";
    const btnIcon = isScanning ? "fa-pause" : "fa-play";
    const btnTitle = isScanning ? StalkerMessages.scanControls.pause : StalkerMessages.scanControls.start;
    return `
            <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
                <input type="text" id="stalker-search" placeholder="${StalkerMessages.scanControls.searchPlaceholder}" class="stalker-search" aria-label="${StalkerMessages.scanControls.searchPlaceholder}">
            </div>
            <button id="toggle-stalker" class="btn-icon ${btnClass} mr-5" title="${btnTitle}" aria-label="${btnTitle}">
                <i class="fa-solid ${btnIcon}" aria-hidden="true"></i>
            </button>
            <button id="refresh-stalker" class="btn-icon" title="${StalkerMessages.scanControls.refresh}" aria-label="${StalkerMessages.scanControls.refresh}">
                <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            </button>
        `;
  },
  renderRow(user, viewBtnText, inspectFn) {
    const tr = document.createElement("tr");
    tr.className = "stalker-row";
    const avatarTd = document.createElement("td");
    const safeUrl = UI.escapeHTML(user.profile_image_url || "");
    const safeName = UI.escapeHTML(user.user_name);
    avatarTd.innerHTML = user.profile_image_url ? `<img src="${safeUrl}" class="table-avatar-img" loading="lazy" alt="${safeName}">` : `<div class="table-avatar-empty"><i class="fa-solid fa-user"></i></div>`;
    const nameTd = document.createElement("td");
    nameTd.className = "word-text text-bold";
    nameTd.textContent = user.user_name;
    const loginTd = document.createElement("td");
    loginTd.className = "count-text text-muted-color";
    loginTd.textContent = `@${user.user_login}`;
    const actionTd = document.createElement("td");
    actionTd.className = "text-right";
    const btn = document.createElement("button");
    btn.className = "action-btn inspect-btn";
    btn.dataset.login = user.user_login;
    btn.innerHTML = viewBtnText;
    btn.onclick = (e) => {
      e.stopPropagation();
      inspectFn(user.user_login);
    };
    actionTd.appendChild(btn);
    tr.appendChild(avatarTd);
    tr.appendChild(nameTd);
    tr.appendChild(loginTd);
    tr.appendChild(actionTd);
    return tr;
  },
  renderRowsSkeleton(count = 5) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><div class="skeleton skeleton-circle" style="width: 32px; height: 32px;"></div></td>
                <td><div class="skeleton" style="width: 100px; height: 16px;"></div></td>
                <td><div class="skeleton" style="width: 80px; height: 14px;"></div></td>
                <td class="text-right"><div class="skeleton" style="width: 60px; height: 28px; border-radius: 6px;"></div></td>
            `;
      fragment.appendChild(tr);
    }
    return fragment;
  }
};

// frontend/features/dashboard/stalker/module.ts
var { API_ENDPOINTS: API_ENDPOINTS4, IGNORED_BOTS: IGNORED_BOTS2 } = DASHBOARD_CONFIG;
var StalkerModule = {
  session: null,
  isScanning: false,
  chatters: [],
  searchTimeout: null,
  isConnected: false,
  initialized: false,
  cssLoaded: false,
  uiInitialized: false,
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
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      Promise.resolve().then(() => (init_loader(), loader_exports)).then(({ Loader: Loader2 }) => {
        Loader2.loadCSS("css/sections/stalker.css");
      });
      this.cssLoaded = true;
    }
    this.initialized = true;
  },
  activate() {
    if (!this.uiInitialized) {
      this.render();
      this.setupUI();
      this.uiInitialized = true;
    }
  },
  setupUI() {
    const controls = document.getElementById("stalker-controls");
    if (controls && !controls.dataset.listener) {
      controls.addEventListener("input", (e) => {
        const target = e.target;
        if (target.id === "stalker-search") {
          if (this.searchTimeout) clearTimeout(this.searchTimeout);
          this.searchTimeout = setTimeout(() => {
            this.filterChatters(target.value);
          }, 300);
        }
      });
      controls.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (btn.id === "toggle-stalker") this.toggleScan();
        if (btn.id === "refresh-stalker") {
          if (this.isScanning) {
            this.loadChatters();
            UI.showToast(StalkerMessages.updatedRaw, "success", "fa-check");
          }
        }
      });
      controls.dataset.listener = "true";
    }
  },
  toggleScan() {
    this.isScanning = !this.isScanning;
    const btn = document.getElementById("toggle-stalker");
    if (btn) {
      btn.className = this.isScanning ? "btn-icon btn-warning" : "btn-icon btn-success";
      btn.innerHTML = this.isScanning ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    }
    const status = document.getElementById("stalker-status");
    if (status) {
      status.innerHTML = this.isScanning ? StalkerMessages.scanStarted : StalkerMessages.scanPaused;
      status.className = this.isScanning ? "text-success" : "text-muted-color";
    }
    if (this.isScanning) {
      UI.showToast(StalkerMessages.scanStartedRaw, "success", "fa-satellite-dish fa-beat");
      this.loadChatters();
      this.connectTmi();
    } else {
      UI.showToast(StalkerMessages.scanPausedRaw, "warning", "fa-snowflake");
      TmiService.disconnect();
      this.isConnected = false;
    }
  },
  connectTmi() {
    if (this.isConnected) return;
    if (!this.session) return;
    const auth = this.session.token ? {
      username: this.session.login,
      token: this.session.token
    } : void 0;
    TmiService.connect(this.session.login, auth).then(() => {
      this.isConnected = true;
      TmiService.addListener(
        "stalker",
        (channel, tags, message) => {
          if (!this.isScanning) return;
          const login = tags.username;
          if (!login) return;
          if (IGNORED_BOTS2.has(login.toLowerCase())) return;
          Promise.resolve().then(() => (init_module(), module_exports)).then(({ TrendsModule: TrendsModule2 }) => {
            TrendsModule2.messageLog.unshift({
              user: login.toLowerCase(),
              text: message,
              time: /* @__PURE__ */ new Date()
            });
            if (TrendsModule2.messageLog.length > TrendsModule2.MAX_LOG_SIZE)
              TrendsModule2.messageLog.pop();
          });
          if (!this.chatters.some(
            (u) => u.user_login.toLowerCase() === login.toLowerCase()
          )) {
            const newUser = {
              user_login: login,
              user_name: tags["display-name"] || login,
              profile_image_url: null
            };
            this.chatters.unshift(newUser);
            this.renderTable(this.chatters);
            document.getElementById("stalker-grid")?.firstChild?.parentElement?.classList.add("row-highlight");
          }
        }
      );
    }).catch((err) => {
      console.error("Stalker TMI Error:", err);
      UI.showToast(
        Messages.Common.connectionError || "Error connecting to chat",
        "error"
      );
      this.toggleScan();
    });
  },
  deactivate() {
    this.isScanning = false;
    TmiService.removeListener("stalker");
    TmiService.disconnect();
    this.isConnected = false;
  },
  render() {
    const container = document.getElementById("stalker-content");
    const controls = document.getElementById("stalker-controls");
    if (controls) controls.innerHTML = StalkerTemplates.renderControls(this.isScanning);
    if (container && container.innerHTML.trim() === "") {
      container.innerHTML = StalkerTemplates.renderMain();
    }
    const gridContainer = document.getElementById("stalker-grid");
    if (gridContainer && !gridContainer.dataset.listener) {
      gridContainer.onclick = (e) => {
        const row = e.target.closest(".stalker-row");
        if (row) {
          const inspectBtn = row.querySelector(".inspect-btn");
          const login = inspectBtn?.dataset.login;
          if (login) this.inspectUser(login);
        }
      };
      gridContainer.dataset.listener = "true";
    }
  },
  async loadChatters() {
    if (!this.isScanning) return;
    const tbody = document.getElementById("stalker-grid");
    const loading = document.getElementById("stalker-loading");
    if (!tbody) return;
    tbody.innerHTML = "";
    loading?.classList.add("hidden");
    tbody.appendChild(StalkerTemplates.renderRowsSkeleton(8));
    try {
      if (!this.session) return;
      const { login } = this.session;
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const res = await fetch(`${API_ENDPOINTS4.CHATTERS}?channel=${login}${q}`, {
        headers: this.authHeaders
      });
      if (!res.ok)
        throw new Error(
          res.status === 401 ? StalkerMessages.reloginMsg : StalkerMessages.apiError
        );
      const data = await res.json();
      const chattersList = Array.isArray(data) ? data : data.chatters || [];
      if (Array.isArray(chattersList)) {
        const apiChatters = chattersList.filter(
          (item) => {
            const login2 = typeof item === "string" ? item : item.user_login;
            return login2 && !IGNORED_BOTS2.has(login2.toLowerCase());
          }
        );
        const chatterMap = /* @__PURE__ */ new Map();
        this.chatters.forEach(
          (c) => chatterMap.set(c.user_login.toLowerCase(), c)
        );
        apiChatters.forEach((item) => {
          const login2 = typeof item === "string" ? item : item.user_login;
          const name = typeof item === "string" ? item : item.user_name;
          if (login2) {
            const userObj = {
              user_login: login2,
              user_name: name || login2,
              profile_image_url: typeof item === "object" ? item.profile_image_url : null
            };
            chatterMap.set(login2.toLowerCase(), userObj);
          }
        });
        this.chatters = Array.from(chatterMap.values());
        this.renderTable(this.chatters);
        loading?.classList.add("hidden");
        if (this.chatters.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">${StalkerMessages.waiting}</div></td></tr>`;
        }
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error(error);
      loading?.classList.add("hidden");
      const safeMsg = UI.escapeHTML(error.message);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px;">${safeMsg}</td></tr>`;
    }
  },
  renderTable(list) {
    const tbody = document.getElementById("stalker-grid");
    if (!tbody) return;
    const fragment = document.createDocumentFragment();
    list.forEach((user) => {
      fragment.appendChild(
        StalkerTemplates.renderRow(
          user,
          Messages.Common.viewBtn,
          (l) => this.inspectUser(l)
        )
      );
    });
    tbody.innerHTML = "";
    tbody.appendChild(fragment);
  },
  filterChatters(query) {
    const q = query.toLowerCase();
    this.renderTable(
      this.chatters.filter(
        (u) => u.user_name.toLowerCase().includes(q) || u.user_login.toLowerCase().includes(q)
      )
    );
  },
  async inspectUser(login) {
    try {
      if (!this.session) return;
      const cacheKey = `user_info_${login}`;
      const cachedInfo = cache.get(cacheKey);
      if (cachedInfo) {
        Promise.resolve().then(() => (init_profileModal(), profileModal_exports)).then(
          ({ ProfileModal: ProfileModal2 }) => ProfileModal2.open(cachedInfo)
        );
        return;
      }
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const res = await fetch(`${API_ENDPOINTS4.USER_INFO}?login=${login}${q}`, {
        headers: this.authHeaders
      });
      if (!res.ok) throw new Error();
      const info = await res.json();
      cache.set(cacheKey, info, CACHE_TTL);
      Promise.resolve().then(() => (init_profileModal(), profileModal_exports)).then(
        ({ ProfileModal: ProfileModal2 }) => ProfileModal2.open(info)
      );
    } catch (_e) {
      UI.showToast(StalkerMessages.loadError, "error");
    }
  }
};

// frontend/features/dashboard/magic8/messages.ts
var Magic8Messages = {
  emptyQuestion: "\u26A0\uFE0F Debes hacer una pregunta primero.",
  consulting: '<i class="fa-solid fa-spinner fa-spin"></i> Consultando...',
  loading: '<div class="magic8-loading"><i class="fa-solid fa-crystal-ball fa-beat"></i> Consultando a los esp\xEDritus...</div>',
  askButton: '<i class="fa-solid fa-play"></i> Preguntar',
  error: /* @__PURE__ */ __name((msg) => `\u274C ${msg}`, "error")
};

// frontend/features/dashboard/magic8/module.ts
init_dashboard_config();
var { API_ENDPOINTS: API_ENDPOINTS5, DOM_IDS } = DASHBOARD_CONFIG;
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
      const url = `${API_ENDPOINTS5.MAGIC8}?${tokenParam}&question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(login || "")}`;
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

// frontend/features/dashboard/roulette/module.ts
init_ui();
init_messages();

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

// frontend/features/dashboard/roulette/module.ts
init_dashboard_config();
init_tmiService();
var { API_ENDPOINTS: API_ENDPOINTS6, IGNORED_BOTS: IGNORED_BOTS3 } = DASHBOARD_CONFIG;
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
          if (IGNORED_BOTS3.has(login.toLowerCase())) return;
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
    fetch(`${API_ENDPOINTS6.CHATTERS}?channel=${login}&${tokenParam}`, { headers }).then((res) => res.json()).then((data) => {
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
          if (!currentChatters.has(lowerLogin) && !IGNORED_BOTS3.has(lowerLogin)) {
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

// frontend/features/dashboard/russian/module.ts
init_dashboard_config();
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

// frontend/features/dashboard/duel/messages.ts
var DuelMessages = {
  emptyTarget: "\u26A0\uFE0F Debes especificar un oponente.",
  fighting: '<i class="fa-solid fa-spinner fa-spin"></i> Peleando...',
  loading: '<div class="duel-loading"><i class="fa-solid fa-khanda fa-shake"></i> Calculando ganador...</div>',
  fightButton: '<i class="fa-solid fa-gavel"></i> \xA1DUELO!',
  error: /* @__PURE__ */ __name((msg) => `\u274C ${msg}`, "error")
};

// frontend/features/dashboard/duel/module.ts
init_dashboard_config();
var { API_ENDPOINTS: API_ENDPOINTS7, DOM_IDS: DOM_IDS2 } = DASHBOARD_CONFIG;
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
    const targetInput = document.getElementById(DOM_IDS2.DUEL.INPUT_TARGET);
    const fightBtn = document.getElementById(DOM_IDS2.DUEL.BUTTON);
    if (!targetInput || !fightBtn) return;
    const handleFight = /* @__PURE__ */ __name(() => this.startDuel(), "handleFight");
    fightBtn.onclick = handleFight;
    targetInput.onkeypress = (e) => {
      if (e.key === "Enter") handleFight();
    };
  },
  setLoading(isLoading) {
    const btn = document.getElementById(DOM_IDS2.DUEL.BUTTON);
    const inputTarget = document.getElementById(DOM_IDS2.DUEL.INPUT_TARGET);
    const inputChallenger = document.getElementById(
      DOM_IDS2.DUEL.INPUT_CHALLENGER
    );
    const responseEl = document.getElementById(DOM_IDS2.DUEL.RESPONSE);
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
    const inputTarget = document.getElementById(DOM_IDS2.DUEL.INPUT_TARGET);
    const inputChallenger = document.getElementById(
      DOM_IDS2.DUEL.INPUT_CHALLENGER
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
      const url = `${API_ENDPOINTS7.DUEL}?${tokenParam}&target=${encodeURIComponent(target)}&challenger=${encodeURIComponent(challenger)}`;
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
    const responseEl = document.getElementById(DOM_IDS2.DUEL.RESPONSE);
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

// frontend/core/profile.ts
init_ui();
init_dashboard_config();

// frontend/features/dashboard/account/messages.ts
var AccountMessages = {
  testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando conexi\xF3n...',
  testError: "\u26A0\uFE0F Error en la prueba de API",
  regenerateConfirm: "\xBFGenerar una nueva API Key? La anterior dejar\xE1 de funcionar inmediatamente.",
  regenerateSuccess: "Nueva API Key generada",
  regenerateError: "Error al generar Key",
  loadingIcon: '<i class="fa-solid fa-spinner fa-spin"></i>',
  rotateIcon: '<i class="fa-solid fa-rotate"></i>'
};

// frontend/core/profile.ts
init_loader();
var ProfileModule = {
  session: null,
  isInitialized: false,
  rateLimitPollInterval: null,
  countdown: 30,
  lastData: {
    followers: -1,
    analytics: {},
    summaries: {}
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
  init(session) {
    this.session = session;
    this.isInitialized = true;
  },
  activate() {
    Loader.loadCSS("./css/sections/profile.css");
    this.setupUIInternal();
    this.loadProfileData();
    this.loadAnalytics();
    this.startSmartPolling();
  },
  deactivate() {
    if (this.rateLimitPollInterval) {
      clearInterval(this.rateLimitPollInterval);
      this.rateLimitPollInterval = null;
    }
  },
  startSmartPolling() {
    if (this.rateLimitPollInterval) clearInterval(this.rateLimitPollInterval);
    const lastSync = localStorage.getItem("dashboard_last_sync");
    const now = Date.now();
    const pollMs = 3e4;
    if (lastSync) {
      const elapsed = now - parseInt(lastSync);
      if (elapsed < pollMs) {
        this.countdown = Math.ceil((pollMs - elapsed) / 1e3);
      } else {
        this.countdown = 30;
        this.performSync();
      }
    } else {
      this.countdown = 30;
      this.performSync();
    }
    this.updateSyncIndicator();
    this.rateLimitPollInterval = setInterval(() => {
      if (typeof this.countdown === "number") {
        this.countdown--;
        if (this.countdown <= 0) {
          this.performSync();
          this.countdown = 30;
        }
      }
      this.updateSyncIndicator();
    }, 1e3);
  },
  updateSyncIndicator() {
    const syncEl = document.getElementById("profile-sync-indicator");
    if (!syncEl) return;
    syncEl.textContent = "Auto";
  },
  async performSync() {
    const syncEl = document.getElementById("profile-sync-indicator");
    if (this.session) {
      localStorage.setItem("dashboard_last_sync", Date.now().toString());
      await Promise.all([this.pollRateLimit(), this.loadAnalytics()]);
    }
    setTimeout(() => {
      if (syncEl) syncEl.classList.remove("syncing");
    }, 1e3);
  },
  setupUIInternal() {
    if (!this.session) return;
    const userIdTag = document.getElementById("profile-user-id");
    const displayName = document.getElementById("profile-display-name");
    const avatar = document.getElementById("profile-large-avatar");
    if (userIdTag) userIdTag.textContent = this.session.userId || "---";
    if (displayName)
      displayName.textContent = this.session.displayName || this.session.login || "Streamer";
    if (avatar && this.session.profile_image_url) {
      avatar.src = this.session.profile_image_url;
    }
    const tokenInput = document.getElementById("profile-api-key");
    if (tokenInput) {
      const realKey = this.session.apiKey || this.session.token || "";
      tokenInput.value = realKey;
      tokenInput.dataset.realValue = realKey;
    }
    this.setupTokenVisibility();
    this.setupRegenerate();
    this.setupCopyId();
    this.setupDangerToggle();
    this.setupDataExport();
    this.setupDangerZone();
  },
  setupDangerToggle() {
    const toggleBtn = document.getElementById("profile-toggle-danger");
    const dangerSection = document.getElementById("danger-zone-section");
    if (toggleBtn && dangerSection && !toggleBtn.dataset.listener) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = dangerSection.classList.contains("is-hidden");
        if (isHidden) {
          dangerSection.classList.remove("is-hidden");
          toggleBtn.classList.add("active");
          toggleBtn.title = "Ocultar Zona de Peligro";
          setTimeout(() => {
            const start = window.pageYOffset;
            const end = document.documentElement.scrollHeight - window.innerHeight;
            const distance = end - start;
            const duration = 1200;
            let startTime = null;
            const easeOutQuint = /* @__PURE__ */ __name((t, b, c, d) => {
              return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            }, "easeOutQuint");
            const animation = /* @__PURE__ */ __name((currentTime) => {
              if (startTime === null) startTime = currentTime;
              const timeElapsed = currentTime - startTime;
              const run = easeOutQuint(timeElapsed, start, distance, duration);
              window.scrollTo(0, run);
              if (timeElapsed < duration) {
                requestAnimationFrame(animation);
              } else {
                window.scrollTo(0, document.documentElement.scrollHeight);
              }
            }, "animation");
            requestAnimationFrame(animation);
          }, 400);
        } else {
          dangerSection.classList.add("is-hidden");
          toggleBtn.classList.remove("active");
          toggleBtn.title = "Mostrar Zona de Peligro";
        }
      });
      toggleBtn.dataset.listener = "true";
    }
  },
  async loadProfileData() {
    if (!this.session) return;
    try {
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}${q}`;
      const response = await fetch(url, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        this.updateProfileStatsInternal(data);
        this.updateBadgesInternal(data);
      }
    } catch (e) {
      console.error("[Profile] Error loading data:", e);
    }
  },
  async pollRateLimit() {
    if (!this.session) return;
    try {
      const q = this.authQuery ? `&${this.authQuery}` : "";
      const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}${q}`;
      const response = await fetch(url, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        const rateLimitEl = document.getElementById("profile-stat-ratelimit");
        if (rateLimitEl && data.rateLimit) {
          rateLimitEl.textContent = `${data.rateLimit} req/min`;
        }
      }
    } catch (_e) {
    }
  },
  async loadAnalytics() {
    if (!this.session) return;
    try {
      const q = this.authQuery ? `?${this.authQuery}` : "";
      const response = await fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS}${q}`, {
        headers: this.authHeaders
      });
      if (response.ok) {
        const data = await response.json();
        this.renderCommandStatsInternal(data);
      }
    } catch (_e) {
      console.error("Error updating statistics", _e);
    }
  },
  renderCommandStatsInternal(data) {
    const statsGrid = document.getElementById("profile-stats-summary-grid");
    if (!statsGrid) return;
    statsGrid.innerHTML = "";
    const categories = [
      {
        id: "cat-commands",
        label: "Comandos",
        icon: "fa-terminal",
        keys: ["clips", "followage", "so"]
      },
      {
        id: "cat-tools",
        label: "Herramientas",
        icon: "fa-screwdriver-wrench",
        keys: ["stalker", "trends", "roulette"]
      },
      {
        id: "cat-minigames",
        label: "Minijuegos",
        icon: "fa-gamepad",
        keys: ["russian", "magic8", "duel"]
      }
    ];
    categories.forEach((cat) => {
      const totalSum = cat.keys.reduce((sum, key) => sum + (data[key] || 0), 0);
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `
                <div class="stat-icon"><i class="fa-solid ${cat.icon}"></i></div>
                <div class="stat-info">
                    <h3 id="profile-sum-${cat.id}">0</h3>
                    <span>${cat.label}</span>
                </div>
            `;
      statsGrid.appendChild(card);
      const valueEl = document.getElementById(`profile-sum-${cat.id}`);
      if (valueEl) {
        const prevSum = this.lastData.summaries?.[cat.id] ?? 0;
        if (prevSum !== totalSum) {
          UI.animateValue(valueEl, null, totalSum);
          if (!this.lastData.summaries) this.lastData.summaries = {};
          this.lastData.summaries[cat.id] = totalSum;
        } else {
          valueEl.textContent = totalSum.toLocaleString();
        }
      }
    });
  },
  updateProfileStatsInternal(data) {
    const followers = document.getElementById("profile-stat-followers");
    const bio = document.getElementById("profile-bio");
    const broadcasterType = document.getElementById("profile-stat-broadcaster");
    const createdAt = document.getElementById("profile-stat-created");
    if (followers) {
      followers.classList.remove("skeleton", "skeleton-text");
      followers.style.width = "";
      followers.style.height = "";
      const targetValue = data.followers || 0;
      if (this.lastData.followers !== targetValue) {
        UI.animateValue(followers, 0, targetValue, 1500);
        this.lastData.followers = targetValue;
      } else {
        followers.textContent = targetValue.toLocaleString();
      }
    }
    if (bio) {
      bio.classList.remove("skeleton", "skeleton-text");
      bio.style.width = "";
      bio.style.height = "";
      bio.textContent = data.description || "Sin biograf\xEDa disponible. \xA1Este streamer es un misterio!";
    }
    if (broadcasterType) {
      broadcasterType.classList.remove("skeleton", "skeleton-text");
      broadcasterType.style.width = "";
      broadcasterType.style.height = "";
      const types = {
        partner: "Partner",
        affiliate: "Afiliado",
        "": "Streamer"
      };
      const type = data.broadcaster_type || "";
      broadcasterType.textContent = types[type] || "Streamer";
    }
    if (createdAt && data.created_at) {
      createdAt.classList.remove("skeleton", "skeleton-text");
      createdAt.style.width = "";
      createdAt.style.height = "";
      try {
        const date = new Date(data.created_at);
        const options = {
          day: "2-digit",
          month: "short",
          year: "numeric"
        };
        createdAt.textContent = date.toLocaleDateString("es-ES", options);
      } catch (_e) {
        createdAt.textContent = "---";
      }
    }
    const rateLimitEl = document.getElementById("profile-stat-ratelimit");
    if (rateLimitEl && data.rateLimit) {
      rateLimitEl.textContent = `${data.rateLimit} req/min`;
    }
  },
  updateBadgesInternal(data) {
    const container = document.getElementById("profile-badges-container");
    if (!container) return;
    let badgesHtml = "";
    if (data.broadcaster_type === "partner") {
      badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-check-circle"></i> Partner de Twitch</span>`;
    } else if (data.broadcaster_type === "affiliate") {
      badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-star"></i> Afiliado de Twitch</span>`;
    } else {
      badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-user"></i> Streamer</span>`;
    }
    badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-key"></i> LosPerris Access</span>`;
    container.innerHTML = badgesHtml;
  },
  setupTokenVisibility() {
    const toggleBtn = document.getElementById("profile-toggle-key");
    const tokenInput = document.getElementById("profile-api-key");
    if (toggleBtn && tokenInput && !toggleBtn.dataset.listener) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = tokenInput.type === "password";
        if (isHidden) {
          tokenInput.type = "text";
          tokenInput.value = tokenInput.dataset.realValue || "";
          toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
          tokenInput.type = "password";
          toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
      });
      toggleBtn.dataset.listener = "true";
    }
  },
  setupCopyId() {
    const copyBtn = document.getElementById("profile-copy-id-btn");
    if (copyBtn && !copyBtn.dataset.listener) {
      copyBtn.addEventListener("click", () => {
        const idEl = document.getElementById("profile-user-id");
        const id = idEl?.textContent?.trim();
        if (!id || id === "---") return;
        navigator.clipboard.writeText(id).then(() => {
          const icon = copyBtn.querySelector("i");
          if (icon) {
            icon.className = "fa-solid fa-check";
            icon.style.opacity = "1";
            icon.style.color = "var(--success)";
            setTimeout(() => {
              icon.className = "fa-regular fa-copy";
              icon.style.opacity = "0.5";
              icon.style.color = "";
            }, 1500);
          }
        });
      });
      copyBtn.dataset.listener = "true";
    }
  },
  setupRegenerate() {
    const regenBtn = document.getElementById("profile-regen-key");
    const modal = document.getElementById("regen-modal");
    if (regenBtn && !regenBtn.dataset.listener) {
      regenBtn.addEventListener("click", async () => {
        if (!modal) return;
        if (!document.getElementById("confirm-regen-btn") && modal.dataset.src) {
          try {
            await HtmlLoader.load(modal.dataset.src, modal.id);
          } catch (_e) {
            UI.showToast("Error al cargar modal de regeneraci\xF3n", "error");
            return;
          }
        }
        const confirmBtn = document.getElementById("confirm-regen-btn");
        if (confirmBtn && !confirmBtn.dataset.listener) {
          confirmBtn.addEventListener("click", async () => {
            const closeBtn2 = document.getElementById("close-regen-btn");
            if (closeBtn2) closeBtn2.click();
            else modal.close();
            UI.setButtonLoading(regenBtn, true);
            try {
              const response = await fetch(
                `${DASHBOARD_CONFIG.API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`
              );
              const data = await response.json();
              if (data.apiKey && this.session) {
                this.session.apiKey = data.apiKey;
                const auth = await Promise.resolve().then(() => (init_auth(), auth_exports));
                auth.Auth.saveSession(this.session);
                const tokenInput = document.getElementById(
                  "profile-api-key"
                );
                if (tokenInput) {
                  tokenInput.dataset.realValue = data.apiKey;
                  if (tokenInput.type === "text") tokenInput.value = data.apiKey;
                }
                UI.showToast(AccountMessages.regenerateSuccess, "success");
              }
            } catch (_e) {
              UI.showToast(AccountMessages.regenerateError, "error");
            } finally {
              UI.setButtonLoading(regenBtn, false);
            }
          });
          confirmBtn.dataset.listener = "true";
        }
        const closeBtn = document.getElementById("close-regen-btn");
        const cancelBtn = document.getElementById("cancel-regen-btn");
        if (closeBtn) closeBtn.onclick = () => modal.close();
        if (cancelBtn) cancelBtn.onclick = () => modal.close();
        modal.showModal();
      });
      regenBtn.dataset.listener = "true";
    }
  },
  async openDangerModal(options) {
    const modal = document.getElementById("danger-action-modal");
    if (!modal) {
      UI.showToast("Error: Modal de seguridad no encontrado", "error");
      return;
    }
    if (!document.getElementById("danger-modal-title") && modal.dataset.src) {
      try {
        await HtmlLoader.load(modal.dataset.src, modal.id);
      } catch (_e) {
        UI.showToast("Error al cargar componente de seguridad", "error");
        return;
      }
    }
    const titleEl = document.getElementById("danger-modal-title");
    const descEl = document.getElementById("danger-modal-desc");
    const wordEl = document.getElementById("danger-modal-word");
    const inputEl = document.getElementById("danger-modal-confirm");
    const submitBtn = document.getElementById("danger-modal-submit");
    const closeBtn = document.getElementById("danger-modal-close");
    const cancelBtn = document.getElementById("danger-modal-cancel");
    if (!titleEl || !descEl || !wordEl || !inputEl || !submitBtn) {
      UI.showToast("Error: Componentes del modal incompletos", "error");
      console.error("[Profile] Missing modal elements:", {
        titleEl,
        descEl,
        wordEl,
        inputEl,
        submitBtn
      });
      return;
    }
    titleEl.innerText = options.title;
    descEl.innerText = options.desc;
    wordEl.innerText = options.word;
    inputEl.value = "";
    submitBtn.disabled = true;
    modal.classList.remove("shake");
    const validate = /* @__PURE__ */ __name(() => {
      submitBtn.disabled = inputEl.value.trim().toUpperCase() !== options.word;
    }, "validate");
    inputEl.oninput = validate;
    return new Promise((resolve) => {
      const cleanup = /* @__PURE__ */ __name(() => {
        inputEl.oninput = null;
        if (closeBtn) closeBtn.onclick = null;
        if (cancelBtn) cancelBtn.onclick = null;
        submitBtn.onclick = null;
        if (modal.open) modal.close();
        resolve();
      }, "cleanup");
      submitBtn.onclick = async () => {
        if (inputEl.value.trim().toUpperCase() === options.word) {
          UI.setButtonLoading(submitBtn, true);
          try {
            await options.onConfirm();
            cleanup();
          } catch (_e) {
            UI.showToast("Error en la acci\xF3n confirmada", "error");
          } finally {
            UI.setButtonLoading(submitBtn, false);
          }
        } else {
          modal.classList.add("shake");
          setTimeout(() => modal.classList.remove("shake"), 500);
        }
      };
      if (closeBtn) closeBtn.onclick = cleanup;
      if (cancelBtn) cancelBtn.onclick = cleanup;
      modal.showModal();
    });
  },
  setupDataExport() {
    const exportBtn = document.getElementById("profile-export-data-btn");
    if (exportBtn && !exportBtn.dataset.listener) {
      exportBtn.addEventListener("click", async () => {
        if (!this.session) return;
        UI.setButtonLoading(exportBtn, true);
        try {
          const { DataExport: DataExport2 } = await Promise.resolve().then(() => (init_dataExporter(), dataExporter_exports));
          await DataExport2.export(this.session);
        } catch (e) {
          console.error("[Profile] Export error:", e);
          UI.showToast("Error al exportar datos", "error");
        } finally {
          UI.setButtonLoading(exportBtn, false);
        }
      });
      exportBtn.dataset.listener = "true";
    }
  },
  setupDangerZone() {
    const clearBtn = document.getElementById("profile-clear-data-btn");
    const deleteBtn = document.getElementById("profile-delete-account-btn");
    if (clearBtn && !clearBtn.dataset.listener) {
      clearBtn.addEventListener("click", () => {
        this.openDangerModal({
          title: "Reiniciar Estad\xEDsticas",
          desc: "Esta acci\xF3n borrar\xE1 todo el historial de comandos, clips y latencia. Tu cuenta y API Key seguir\xE1n activas.",
          word: "LIMPIAR",
          onConfirm: /* @__PURE__ */ __name(async () => {
            try {
              const q = this.authQuery ? `?${this.authQuery}` : "";
              const response = await fetch(
                `${DASHBOARD_CONFIG.API_ENDPOINTS.CLEAR_DATA}${q}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...this.authHeaders
                  },
                  body: JSON.stringify({ confirm: "LIMPIAR" })
                }
              );
              const data = await response.json();
              if (data.success) {
                UI.showToast(data.message, "success");
                setTimeout(() => window.location.reload(), 1500);
              } else {
                UI.showToast(data.error || "Error al limpiar datos", "error");
              }
            } catch (_e) {
              UI.showToast("Error de conexi\xF3n", "error");
            }
          }, "onConfirm")
        });
      });
      clearBtn.dataset.listener = "true";
    }
    if (deleteBtn && !deleteBtn.dataset.listener) {
      deleteBtn.addEventListener("click", () => {
        this.openDangerModal({
          title: "Eliminar Perfil de LosPerris API",
          desc: "\xA1ATENCI\xD3N! Esta acci\xF3n es irreversible dentro de nuestra plataforma. Se borrar\xE1n tus datos y API Key. Esto NO afectar\xE1 a tu canal ni cuenta de Twitch de ninguna manera.",
          word: "ELIMINAR",
          onConfirm: /* @__PURE__ */ __name(async () => {
            try {
              const q = this.authQuery ? `?${this.authQuery}` : "";
              const response = await fetch(
                `${DASHBOARD_CONFIG.API_ENDPOINTS.DELETE_ACCOUNT}${q}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    ...this.authHeaders
                  },
                  body: JSON.stringify({ confirm: "ELIMINAR" })
                }
              );
              const data = await response.json();
              if (data.success) {
                UI.showToast("Cuenta eliminada. Redirigiendo...", "success");
                setTimeout(() => {
                  window.location.href = "/logout";
                }, 2e3);
              } else {
                UI.showToast(data.error || "Error al eliminar cuenta", "error");
              }
            } catch (_e) {
              UI.showToast("Error de conexi\xF3n", "error");
            }
          }, "onConfirm")
        });
      });
      deleteBtn.dataset.listener = "true";
    }
  }
};

// frontend/features/dashboard/feedback/messages.ts
var FeedbackMessages = {
  emptyMessage: "Por favor, escribe un mensaje.",
  sending: '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...',
  defaultButton: '<i class="fa-solid fa-paper-plane"></i> Enviar Feedback',
  success: "\xA1Feedback enviado! Gracias por tu aporte.",
  error: "Error al enviar. Intenta m\xE1s tarde.",
  connectionError: "Error de conexi\xF3n."
};

// frontend/features/dashboard/feedback.ts
init_dashboard_config();
init_ui();
var { API_ENDPOINTS: API_ENDPOINTS8 } = DASHBOARD_CONFIG;
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
      const response = await fetch(API_ENDPOINTS8.FEEDBACK, {
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

// frontend/core/dashboard.ts
var Dashboard = {
  session: null,
  activeModules: [],
  async init(session) {
    this.session = session;
    this.setupTabs();
    this.setupUserBadge();
    this.initAllModules();
    await this.loadTab("tab-home");
    setTimeout(() => {
      this.preloadAllTabsBackground();
    }, 1e3);
  },
  preloadAllTabsBackground() {
    const panes = document.querySelectorAll(".tab-pane");
    panes.forEach((pane) => {
      if (pane instanceof HTMLElement && pane.dataset.src && pane.id !== "tab-home") {
        HtmlLoader.load(pane.dataset.src, pane.id).catch(console.error);
      }
    });
  },
  initAllModules() {
    if (!this.session) return;
    const modules = [
      HomeModule,
      ProfileModule,
      CommandsModule,
      ClipsModule,
      TrendsModule,
      StalkerModule,
      Magic8Module,
      RouletteModule,
      RussianModule,
      DuelModule,
      FeedbackModule
    ];
    modules.forEach((mod) => {
      if (mod && typeof mod.init === "function") {
        try {
          mod.init(this.session);
        } catch (e) {
          console.warn("Error initializing module:", e);
        }
      }
    });
  },
  setupUserBadge() {
    if (!this.session) return;
    const { displayName, profile_image_url } = this.session;
    const avatar = document.getElementById("user-avatar");
    const name = document.getElementById("user-display-name");
    if (avatar instanceof HTMLImageElement && profile_image_url) {
      avatar.src = profile_image_url;
      avatar.style.display = "block";
    }
    if (name && displayName) {
      name.innerText = displayName;
    }
    const toggle = document.getElementById("user-dropdown-toggle");
    const container = document.querySelector(".user-dropdown-container");
    const menu = document.getElementById("user-menu");
    if (toggle && container && menu) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        container.classList.toggle("active");
      });
      document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
          container.classList.remove("active");
        }
      });
      const profileBtn = document.getElementById("btn-profile");
      if (profileBtn) {
        profileBtn.addEventListener("click", () => {
          container.classList.remove("active");
          document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
          const pane = document.getElementById("tab-profile");
          if (pane) pane.classList.add("active");
          this.loadTab("tab-profile");
          document.querySelectorAll(".nav-item").forEach((t) => t.classList.remove("active"));
        });
      }
      document.getElementById("logout-btn-header")?.addEventListener("click", () => {
        Promise.resolve().then(() => (init_auth(), auth_exports)).then((m) => m.Auth.logout());
      });
    }
    this.updatePageTitle("tab-home");
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      Promise.resolve().then(() => (init_auth(), auth_exports)).then((m) => m.Auth.logout());
    });
  },
  updatePageTitle(tabId) {
    const pageTitle = document.getElementById("page-title");
    if (!pageTitle) return;
    const titleMap = {
      "tab-home": '<i class="fa-solid fa-house"></i> Inicio',
      "tab-profile": '<i class="fa-solid fa-user"></i> Mi Perfil',
      "tab-followage": '<i class="fa-solid fa-clock-rotate-left"></i> Followage',
      "tab-clips": '<i class="fa-solid fa-film"></i> Clips',
      "tab-shoutout": '<i class="fa-solid fa-bullhorn"></i> Shoutout',
      "tab-tracker": '<i class="fa-solid fa-chart-line"></i> Tendencias',
      "tab-stalker": '<i class="fa-solid fa-users-viewfinder"></i> Stalker',
      "tab-magic8": '<i class="fa-solid fa-8"></i> Bola 8 M\xE1gica',
      "tab-roulette": '<i class="fa-solid fa-dice"></i> Ruleta',
      "tab-russian": '<i class="fa-solid fa-skull-crossbones"></i> Ruleta Rusa',
      "tab-duel": '<i class="fa-solid fa-khanda"></i> Duelo',
      "tab-feedback": '<i class="fa-solid fa-comment-dots"></i> Feedback'
    };
    const title = titleMap[tabId] || '<i class="fa-solid fa-gauge"></i> Dashboard';
    pageTitle.innerHTML = title;
  },
  setupTabs() {
    const tabs = document.querySelectorAll(".nav-item");
    tabs.forEach((tab) => {
      const htmlTab = tab;
      htmlTab.addEventListener("click", async () => {
        if (htmlTab.classList.contains("external-link")) return;
        tabs.forEach((t) => t.classList.remove("active"));
        htmlTab.classList.add("active");
        document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
        const tabId = htmlTab.dataset.tab;
        const pane = document.getElementById(tabId);
        if (pane) pane.classList.add("active");
        await this.loadTab(tabId);
      });
    });
  },
  async loadTab(tabId) {
    if (!this.session) return;
    this.updatePageTitle(tabId);
    this.activeModules.forEach((mod) => {
      if (mod && typeof mod.deactivate === "function") {
        try {
          mod.deactivate();
        } catch (error) {
          console.error("Error al desactivar m\xF3dulo:", error);
        }
      }
    });
    this.activeModules = [];
    const pane = document.getElementById(tabId);
    if (pane && pane.dataset.src) {
      try {
        await HtmlLoader.load(pane.dataset.src, pane.id);
      } catch (error) {
        console.error(`Error loading HTML for tab ${tabId}:`, error);
      }
    }
    const moduleMap = {
      "tab-home": [HomeModule],
      "tab-profile": [ProfileModule],
      "tab-followage": [CommandsModule],
      "tab-clips": [ClipsModule, CommandsModule],
      "tab-shoutout": [CommandsModule],
      "tab-tracker": [TrendsModule],
      "tab-stalker": [StalkerModule],
      "tab-magic8": [Magic8Module, CommandsModule],
      "tab-roulette": [RouletteModule],
      "tab-russian": [RussianModule, CommandsModule],
      "tab-duel": [DuelModule, CommandsModule],
      "tab-feedback": [FeedbackModule]
    };
    if (moduleMap[tabId]) {
      this.activeModules = moduleMap[tabId];
      this.activeModules.forEach((mod) => {
        if (mod && typeof mod.activate === "function") {
          mod.activate();
        }
      });
    }
  }
};

// frontend/shared/components/footer.ts
var FooterComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const html = `
            <div class="footer-content">
                <p>&copy; ${year} <a href="${origin}" target="_blank" rel="noopener">${hostname}</a>. Creado para la comunidad. No afiliado con Twitch o Amazon.</p>
            </div>
        `;
    container.innerHTML = html;
    container.classList.add("app-footer");
  }
};

// frontend/app-dashboard.ts
init_messages();
init_authMessages();
document.addEventListener("DOMContentLoaded", async () => {
  FooterComponent.render("main-footer");
  UI.setupClipboard();
  const sessionParams = Auth.parseUrlParams();
  const { apiKey, token } = sessionParams;
  if (!apiKey && !token) {
    window.location.href = "./";
    return;
  }
  let validationResult = null;
  try {
    const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
    validationResult = await Auth.validateCurrentToken(credentialParam);
  } catch (e) {
    console.error("Error executing validation:", e);
    validationResult = { valid: true, error: true };
  }
  if (validationResult && validationResult.valid) {
    if (validationResult.error) {
      UI.showToast("Conexi\xF3n inestable con el servidor", "warning");
    }
    try {
      let avatarUrl = null;
      let displayName = sessionParams.displayName || sessionParams.login;
      if (typeof validationResult === "object" && validationResult !== null) {
        const data = validationResult;
        const user = data.user;
        if (!user) {
          throw new Error("User data missing in validation");
        }
        if (data.token) {
          sessionParams.token = data.token;
        }
        avatarUrl = user.profile_image_url;
        if (user.display_name) {
          displayName = user.display_name;
        }
        sessionParams.displayName = displayName;
        sessionParams.profile_image_url = avatarUrl;
      }
      if (validationResult && typeof validationResult === "object" && validationResult.apiKey) {
        sessionParams.apiKey = validationResult.apiKey;
      }
      await Dashboard.init(sessionParams);
      Auth.saveSession(sessionParams);
      if (sessionParams.isNewLogin) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        Auth.saveSession(sessionParams);
      }
    } catch (initError) {
      console.error("CRITICAL: Error initializing dashboard:", initError);
      UI.showToast(Messages.Common.errorLoadingUI(initError.message), "error");
    }
  } else {
    console.warn("Token invalid");
    UI.showToast(AuthMessages.sessionExpired, "error");
    Auth.clearSession();
    setTimeout(() => {
      window.location.href = "./";
    }, 2e3);
  }
});
