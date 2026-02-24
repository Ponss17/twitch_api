var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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

// frontend/features/dashboard/dashboard-config.ts
var API_BASE2 = "/api/twitch";
var DASHBOARD_CONFIG = {
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

// frontend/shared/i18n/uiMessages.ts
var UIMessages = {
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

// frontend/core/ui-core.ts
var UI = {
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

// frontend/features/dashboard/commands/module.ts
var { API_ENDPOINTS } = DASHBOARD_CONFIG;
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
    const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.BASE}`;
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
      const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
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
export {
  CommandsModule
};
