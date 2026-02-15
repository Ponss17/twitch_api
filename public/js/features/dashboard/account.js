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

    deactivate() { },

    updateValues() {
        const userIdInput = document.getElementById("user-id");
        const tokenInput = document.getElementById("user-token");

        if (this.session) {
            if (userIdInput) userIdInput.value = this.session.userId || "";
            if (tokenInput) {
                const val = this.session.apiKey || this.session.token || "";
                tokenInput.value = val;
                tokenInput.dataset.realValue = val;
            }
        }
    },

    setupUI() {
        this.updateValues();
        this.setupTokenVisibility();
        this.setupRegenerate();
    },

    setupTokenVisibility() {
        const btn = document.getElementById("toggle-token-btn");
        const input = document.getElementById("user-token");

        if (btn && input && !btn.dataset.listener) {
            btn.addEventListener("click", () => {
                if (input.type === "password") {
                    input.type = "text";
                    input.value = input.dataset.realValue || "";
                    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    input.type = "password";
                    btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
            btn.dataset.listener = "true";
        }
    },

    setupRegenerate() {
        const btn = document.getElementById("regenerate-token-btn");

        if (btn && !btn.dataset.listener) {
            btn.addEventListener("click", async () => {
                if (confirm(AccountMessages.regenerateConfirm)) {
                    UI.setButtonLoading(btn, true);
                    try {
                        const response = await fetch(`${API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`);
                        const data = await response.json();

                        if (data.apiKey) {
                            if (this.session) {
                                this.session.apiKey = data.apiKey;
                                import("../../core/auth.js").then(({ Auth }) => {
                                    Auth.saveSession(this.session);
                                });
                            }

                            const input = document.getElementById("user-token");
                            if (input) {
                                input.dataset.realValue = data.apiKey;
                                if (input.type === "text") {
                                    input.value = data.apiKey;
                                }
                            }
                            UI.showToast(AccountMessages.regenerateSuccess, "success");
                        }
                    } catch (e) {
                        UI.showToast(AccountMessages.regenerateError, "error");
                    } finally {
                        UI.setButtonLoading(btn, false);
                    }
                }
            });
            btn.dataset.listener = "true";
        }
    }
};

export { AccountModule };
