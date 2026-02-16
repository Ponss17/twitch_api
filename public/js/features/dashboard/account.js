import { AccountMessages } from "./account/messages.js";
import { DASHBOARD_CONFIG } from "./dashboard-config.js";
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { UI } from "../../core/ui.js";
const AccountModule = {
  session: null,
  isInitialized: false,
  init(session) {
    this.session = session;
    this.setupUI();
    this.isInitialized = true;
  },
  deactivate() {
  },
  updateValues() {
    const userIdInput = document.getElementById("user-id");
    const userTokenInput = document.getElementById("user-token");
    if (this.session) {
      if (userIdInput) userIdInput.value = this.session.userId || "";
      if (userTokenInput) {
        userTokenInput.value = this.session.apiKey || this.session.token || "";
        userTokenInput.dataset.realValue = this.session.apiKey || this.session.token || "";
      }
      const heroName = document.getElementById("hero-user-name");
      if (heroName) {
        heroName.textContent = this.session.displayName || this.session.login || "Streamer";
      }
    }
  },
  setupUI() {
    this.updateValues();
    this.setupTokenVisibility();
    this.setupRegenerate();
  },
  setupTokenVisibility() {
    const toggleBtn = document.getElementById("toggle-token-btn");
    const tokenInput = document.getElementById("user-token");
    if (toggleBtn && tokenInput && !toggleBtn.dataset.listener) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = tokenInput.type === "password";
        if (isHidden) {
          tokenInput.type = "text";
          tokenInput.value = tokenInput.dataset.realValue || "";
          toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
          tokenInput.type = "password";
          toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
      });
      toggleBtn.dataset.listener = "true";
    }
  },
  setupRegenerate() {
    const regenBtn = document.getElementById("regenerate-token-btn");
    const modal = document.getElementById("regen-modal");
    const confirmBtn = document.getElementById("confirm-regen-btn");
    const cancelBtn = document.getElementById("cancel-regen-btn");
    const closeBtn = document.getElementById("close-regen-btn");
    const showModal = () => {
      if (modal) {
        if (typeof modal.showModal === "function") {
          modal.showModal();
        } else {
          modal.style.display = "block";
        }
      }
    };
    const closeModal = () => {
      if (modal) {
        if (typeof modal.close === "function") {
          modal.close();
        } else {
          modal.style.display = "none";
        }
      }
    };
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
    if (confirmBtn) {
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
      newConfirmBtn.addEventListener("click", async () => {
        closeModal();
        if (!regenBtn) return;
        UI.setButtonLoading(regenBtn, true);
        try {
          const response = await fetch(
            `${API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`
          );
          const data = await response.json();
          if (data.apiKey) {
            if (this.session) {
              this.session.apiKey = data.apiKey;
              import("../../core/auth.js").then(({ Auth }) => {
                Auth.saveSession(this.session);
              });
            }
            const tokenInput = document.getElementById(
              "user-token"
            );
            if (tokenInput) {
              tokenInput.dataset.realValue = data.apiKey;
              if (tokenInput.type === "text") {
                tokenInput.value = data.apiKey;
              }
            }
            UI.showToast(AccountMessages.regenerateSuccess, "success");
          }
        } catch (_e) {
          UI.showToast(AccountMessages.regenerateError, "error");
        } finally {
          UI.setButtonLoading(regenBtn, false);
        }
      });
    }
    if (regenBtn && !regenBtn.dataset.listener) {
      regenBtn.addEventListener("click", () => {
        showModal();
      });
      regenBtn.dataset.listener = "true";
    }
  }
};
export {
  AccountModule
};
