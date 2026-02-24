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
var API_BASE, DASHBOARD_CONFIG;
var init_dashboard_config = __esm({
  "frontend/features/dashboard/dashboard-config.ts"() {
    "use strict";
    API_BASE = "/api/twitch";
    DASHBOARD_CONFIG = {
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

// frontend/core/profile.ts
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
export {
  ProfileModule
};
