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

// frontend/config.ts
var protocol, host, API_BASE2, CONFIG;
var init_config = __esm({
  "frontend/config.ts"() {
    "use strict";
    protocol = window.location.protocol;
    host = window.location.host;
    API_BASE2 = "/api/twitch";
    CONFIG = {
      domain: host,
      siteUrl: `${protocol}//${host}`,
      API_URL: API_BASE2,
      twitchRedirectUri: `${protocol}//${host}/auth/twitch/callback`
    };
    Object.freeze(CONFIG);
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

// frontend/features/dashboard/clips.ts
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
var { API_ENDPOINTS } = DASHBOARD_CONFIG;
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
      const url = `${API_ENDPOINTS.CLIPS}?${params.join("&")}`;
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
export {
  ClipsModule
};
