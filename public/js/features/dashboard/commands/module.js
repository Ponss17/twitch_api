var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { CONFIG } from "../../../config.js";
import { DASHBOARD_CONFIG } from "../dashboard-config.js";
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { CommandsMessages } from "./messages.js";
import { CommandGenerator } from "../../../shared/utils/commandGenerator.js";
import { COMMAND_CONFIG } from "./config.js";
import { CommandTemplates } from "./templates.js";
import { UI } from "../../../core/ui.js";
window.CommandUtils = { CommandGenerator };
const CommandsModule = {
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
