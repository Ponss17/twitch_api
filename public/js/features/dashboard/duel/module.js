var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { DuelMessages } from "./messages.js";
import { DASHBOARD_CONFIG } from "../dashboard-config.js";
const { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
const DuelModule = {
  session: null,
  initialized: false,
  uiInitialized: false,
  cssLoaded: false,
  init(session) {
    this.session = session;
    if (!this.cssLoaded) {
      import("../../../shared/utils/loader.js").then(({ Loader }) => {
        Loader.loadCSS("css/sections/duel.css");
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
        const { formatApiError } = await import("../../../shared/utils/api-errors.js");
        const errorMsg = await formatApiError(res);
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
