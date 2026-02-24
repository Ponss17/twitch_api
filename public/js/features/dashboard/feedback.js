import { FeedbackMessages } from "./feedback/messages.js";
import { DASHBOARD_CONFIG } from "./dashboard-config.js";
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
import { UI } from "../../core/ui.js";
const FeedbackModule = {
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
      const response = await fetch(API_ENDPOINTS.FEEDBACK, {
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
export {
  FeedbackModule
};
