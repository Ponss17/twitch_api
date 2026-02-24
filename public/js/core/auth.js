import { CONFIG } from "../config.js";
const Auth = {
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
          import("./ui.js").then(({ UI }) => {
            UI.showToast("Tu API Key ha sido actualizada", "info");
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
export {
  Auth
};
