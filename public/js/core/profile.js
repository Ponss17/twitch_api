import { UI } from "./ui.js";
import { DASHBOARD_CONFIG } from "../features/dashboard/dashboard-config.js";
import { AccountMessages } from "../features/dashboard/account/messages.js";
const ProfileModule = {
  session: null,
  isInitialized: false,
  rateLimitPollInterval: null,
  get authToken() {
    return this.session?.token || "";
  },
  init(session) {
    this.session = session;
    this.isInitialized = true;
  },
  activate() {
    this.setupUIInternal();
    this.loadProfileData();
    this.loadAnalytics();
    if (this.rateLimitPollInterval) clearInterval(this.rateLimitPollInterval);
    this.rateLimitPollInterval = setInterval(() => this.pollRateLimit(), 3e4);
  },
  deactivate() {
    if (this.rateLimitPollInterval) {
      clearInterval(this.rateLimitPollInterval);
      this.rateLimitPollInterval = null;
    }
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
  },
  async loadProfileData() {
    if (!this.session) return;
    try {
      const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.authToken}` }
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
      const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.authToken}` }
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
      const response = await fetch(DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        this.renderCommandStatsInternal(data);
      }
    } catch (e) {
      console.error("[Profile] Error loading analytics:", e);
    }
  },
  renderCommandStatsInternal(data) {
    const container = document.getElementById("profile-commands-grid");
    if (!container) return;
    const statConfig = [
      { key: "clips", icon: "fa-film", label: "Clips" },
      { key: "followage", icon: "fa-clock", label: "Followage" },
      { key: "so", icon: "fa-bullhorn", label: "Shoutouts" }
    ];
    let html = "";
    statConfig.forEach((stat, index) => {
      const value = data[stat.key] || 0;
      html += `
                <div class="stat-card stagger-${index + 1}">
                    <div class="stat-icon"><i class="fa-solid ${stat.icon}"></i></div>
                    <div class="stat-info">
                        <h3 class="counter" data-target="${value}">0</h3>
                        <span>${stat.label}</span>
                    </div>
                </div>
            `;
    });
    container.innerHTML = html;
    requestAnimationFrame(() => {
      container.querySelectorAll(".counter").forEach((counter) => {
        const target = parseInt(counter.dataset.target || "0");
        UI.animateValue(counter, 0, target, 1500);
      });
    });
  },
  updateProfileStatsInternal(data) {
    const followers = document.getElementById("profile-stat-followers");
    const bio = document.getElementById("profile-bio");
    const broadcasterType = document.getElementById("profile-stat-broadcaster");
    const createdAt = document.getElementById("profile-stat-created");
    if (followers) {
      const targetValue = data.followers || 0;
      UI.animateValue(followers, 0, targetValue, 1500);
    }
    if (bio)
      bio.textContent = data.description || "Sin biograf\xEDa disponible. \xA1Este streamer es un misterio!";
    if (broadcasterType) {
      const types = {
        partner: "Partner",
        affiliate: "Afiliado",
        "": "Streamer"
      };
      broadcasterType.textContent = types[data.broadcaster_type] || "Streamer";
    }
    if (createdAt && data.created_at) {
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
    const confirmBtn = document.getElementById("confirm-regen-btn");
    if (regenBtn && !regenBtn.dataset.listener) {
      regenBtn.addEventListener("click", () => {
        if (modal) {
          if (typeof modal.showModal === "function") {
            modal.showModal();
          } else {
            modal.style.display = "block";
          }
        }
      });
      regenBtn.dataset.listener = "true";
    }
    if (confirmBtn && !confirmBtn.dataset.listener) {
      confirmBtn.addEventListener("click", async () => {
        const closeBtn = document.getElementById("close-regen-btn");
        if (closeBtn) closeBtn.click();
        if (!regenBtn) return;
        UI.setButtonLoading(regenBtn, true);
        try {
          const response = await fetch(
            `${DASHBOARD_CONFIG.API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`
          );
          const data = await response.json();
          if (data.apiKey) {
            if (this.session) {
              this.session.apiKey = data.apiKey;
              const auth = await import("./auth.js");
              auth.Auth.saveSession(this.session);
            }
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
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};
export {
  ProfileModule
};
