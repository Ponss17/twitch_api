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

// frontend/landing/ui-landing.ts
init_uiMessages();
var LandingUI = {
  setupHeroAnimation(heroCodeDisplay) {
    if (!heroCodeDisplay) return;
    heroCodeDisplay.innerHTML = `
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${UIMessages.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area">
                             <img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon input-badge" alt="Broadcaster">
                        </div>
                        <div class="input-content-wrapper" style="position:relative; flex:1;">
                            <span class="input-text" id="sim-input-text"></span>
                            <span class="input-placeholder" id="sim-placeholder">${UIMessages.ChatSim.placeholder}</span>
                        </div>
                    </div>
                    <div class="input-actions">
                        <button class="twitch-btn">${UIMessages.ChatSim.btnText}</button>
                    </div>
                </div>
            </div>
        `;
    const messagesContainer = document.getElementById("sim-messages");
    const inputText = document.getElementById("sim-input-text");
    const placeholder = document.getElementById("sim-placeholder");
    const inputBox = document.getElementById("sim-input-box");
    const scenarios = [
      {
        cmd: "!followage",
        response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.followage("ponss17", "LosPerris", "1 a\xF1o, 4 meses y 20 d\xEDas")}</span>`
      },
      {
        cmd: "!clip",
        response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.clip("ponss17", "https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...")}</span>`
      },
      {
        cmd: "!so  @mynana17",
        response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.shoutout("mynana17", "Just Chatting")}</span>`
      }
    ];
    let currentScenario = 0;
    const typeWriter = /* @__PURE__ */ __name((text) => {
      return new Promise((resolve) => {
        inputBox.classList.add("typing");
        placeholder.style.display = "none";
        inputText.innerText = "";
        let i = 0;
        const interval = setInterval(() => {
          inputText.innerText += text.charAt(i);
          i++;
          if (i > text.length - 1) {
            clearInterval(interval);
            setTimeout(resolve, 500);
          }
        }, 100);
      });
    }, "typeWriter");
    const addMessage = /* @__PURE__ */ __name((html) => {
      const div = document.createElement("div");
      div.className = "chat-line";
      div.innerHTML = html;
      messagesContainer.appendChild(div);
      if (messagesContainer.children.length > 5) {
        messagesContainer.removeChild(messagesContainer.children[0]);
      }
    }, "addMessage");
    const sleep = /* @__PURE__ */ __name((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
    const runSimulation = /* @__PURE__ */ __name(async () => {
      while (true) {
        const scenario = scenarios[currentScenario];
        await sleep(1500);
        await typeWriter(scenario.cmd);
        inputText.innerText = "";
        placeholder.style.display = "block";
        inputBox.classList.remove("typing");
        addMessage(`
                    <span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon" alt="Broadcaster"></span>
                    <span class="chat-username" style="color:#FF69B4">ponss17</span>
                    <span class="chat-colon">:</span>
                    <span class="chat-text">${scenario.cmd}</span>
                `);
        await sleep(1500);
        addMessage(scenario.response);
        currentScenario = (currentScenario + 1) % scenarios.length;
        if (currentScenario === 0) {
          await sleep(2e3);
          await typeWriter("/clear");
          await sleep(500);
          inputText.innerText = "";
          placeholder.style.display = "block";
          inputBox.classList.remove("typing");
          messagesContainer.innerHTML = `<div class="chat-line" style="opacity:0.5"><span class="chat-text">${UIMessages.ChatSim.welcome}</span></div>`;
          await sleep(1e3);
        }
      }
    }, "runSimulation");
    runSimulation();
  }
};

// frontend/shared/components/header.ts
var HeaderComponent = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const html = `
            <div class="container">
                <div class="logo-container">
                    <img src="img/LosPerris-minimal.webp" alt="Logo" class="logo-img" loading="lazy">
                    <h1 class="brand-logo">LosPerris <span class="accent-text">Twitch Api</span></h1>
                </div>
                <nav class="top-nav">
                    <a href="docs" class="nav-link"><i class="fa-solid fa-book"></i> Documentaci\xF3n</a>
                    <a href="https://discord.gg/8uN3qY5E" target="_blank" class="nav-link"><i class="fa-brands fa-discord"></i> Comunidad</a>
                </nav>
            </div>
        `;
    container.innerHTML = html;
    container.className = "main-header fade-in";
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

// frontend/landing/landing.ts
function setupFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question?.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });
      if (isActive) {
        item.classList.remove("active");
      } else {
        item.classList.add("active");
      }
    });
  });
}
__name(setupFAQ, "setupFAQ");
document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("disclaimer-modal");
  const loginBtn = document.getElementById("login-btn");
  const confirmBtn = document.getElementById("confirm-login-btn");
  const cancelBtn = document.getElementById("cancel-login-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const disclaimerText = document.querySelector(".disclaimer");
  const showModal = /* @__PURE__ */ __name(() => {
    if (modal) {
      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.style.display = "block";
      }
    }
  }, "showModal");
  const closeModal = /* @__PURE__ */ __name(() => {
    if (modal) {
      if (typeof modal.close === "function") {
        modal.close();
      } else {
        modal.style.display = "none";
      }
    }
  }, "closeModal");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showModal();
    });
  }
  if (disclaimerText) {
    disclaimerText.addEventListener("click", () => {
      showModal();
    });
    disclaimerText.style.cursor = "pointer";
    disclaimerText.title = "Ver detalles de privacidad";
  }
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const icon = confirmBtn.querySelector("i");
      if (icon) {
        icon.className = "fa-solid fa-spinner fa-spin";
      }
      confirmBtn.style.opacity = "0.8";
      confirmBtn.style.pointerEvents = "none";
      Auth.relogin();
    });
  }
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        closeModal();
      }
    });
  }
  const heroCode = document.getElementById("hero-code-display");
  if (heroCode) LandingUI.setupHeroAnimation(heroCode);
  HeaderComponent.render("main-header");
  FooterComponent.render("main-footer");
  setupFAQ();
  const header = document.getElementById("main-header");
  const handleScroll = /* @__PURE__ */ __name(() => {
    if (window.scrollY > 50) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  }, "handleScroll");
  window.addEventListener("scroll", handleScroll);
  handleScroll();
  const sessionParams = Auth.parseUrlParams();
  if (sessionParams.token || sessionParams.apiKey) {
    const query = window.location.search;
    window.location.href = query ? `./dashboard${query}` : "./dashboard";
  }
});
