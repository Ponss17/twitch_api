import { DASHBOARD_CONFIG } from "./dashboard-config.js";
const { API_ENDPOINTS } = DASHBOARD_CONFIG;
const HomeModule = {
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
    if (this.session) {
      const heroName = document.getElementById("hero-user-name");
      if (heroName) {
        heroName.textContent = this.session.displayName || this.session.login || "Streamer";
      }
    }
  },
  setupUI() {
    this.updateValues();
    this.loadRealActivity();
    this.loadRealStats();
    this.loadRealHealth();
    this.setupNavigation();
  },
  setupNavigation() {
    const btns = document.querySelectorAll(".clickable-tab");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        if (!tabId) return;
        const sidebarBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (sidebarBtn) {
          sidebarBtn.click();
        }
      });
    });
  },
  async loadRealHealth() {
    const pill = document.getElementById("home-health-pill");
    const label = pill?.querySelector(".status-label");
    if (!pill || !label || !this.session) return;
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH, {
        headers: { Authorization: `Bearer ${this.session?.token}` }
      });
      if (response.ok) {
        const health = await response.json();
        label.textContent = health.status === "operational" ? "Todos los Sistemas Operativos" : "Sistemas Degradados";
        pill.className = `system-status-pill ${health.status}`;
        const latencyEl = document.getElementById("home-stat-latency");
        if (latencyEl) {
          const parts = health.latency.split(" ");
          if (parts.length > 1) {
            latencyEl.innerHTML = `${parts[0]} <span class="stat-unit-alt">${parts[1]}</span>`;
          } else {
            latencyEl.textContent = health.latency;
          }
        }
      }
    } catch (e) {
      console.error("[Home] Error loading health:", e);
      label.textContent = "Error de Conexi\xF3n";
      pill.className = "system-status-pill down";
    }
  },
  async loadRealActivity() {
    const logContainer = document.getElementById("home-activity-logs");
    if (!logContainer || !this.session?.token) return;
    await new Promise((r) => setTimeout(r, 600));
    try {
      const response = await fetch(`${API_ENDPOINTS.ACTIVITY}?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${this.session?.token}` }
      });
      if (response.ok) {
        const logs = await response.json();
        logContainer.innerHTML = "";
        if (logs.length === 0) {
          logContainer.innerHTML = '<div class="log-placeholder">No hay actividad reciente registrada.</div>';
          return;
        }
        logs.forEach((log) => {
          const time = new Date(log.timestamp).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit"
          });
          const logElement = document.createElement("div");
          logElement.className = "log-entry";
          logElement.innerHTML = `
                        <span class="log-time">[${time}]</span>
                        <span class="log-msg">${log.action}</span>
                    `;
          logContainer.appendChild(logElement);
        });
      }
    } catch (e) {
      console.error("[Home] Error loading activity:", e);
      logContainer.innerHTML = '<div class="log-placeholder text-danger">Error al conectar con el feed de actividad.</div>';
    }
  },
  async loadRealStats() {
    if (!this.session?.token) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${this.session.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const todayRequests = data.todayRequests || 0;
        const successRate = data.rawSuccessRate || 0;
        const avgLatency = parseInt(data.averageLatency) || 0;
        this.animateSingleStat("home-stat-requests", todayRequests, "");
        this.animateSingleStat("home-stat-success", successRate, "%");
        this.animateSingleStat(
          "home-stat-latency",
          avgLatency,
          `ms <span class="stat-unit-alt">(${(avgLatency / 1e3).toFixed(1)}s)</span>`
        );
      }
    } catch (e) {
      console.error("[Home] Error loading stats:", e);
    }
  },
  animateSingleStat(id, target, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 30);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.innerHTML = `${target}${suffix}`;
        clearInterval(timer);
      } else {
        el.innerHTML = `${current.toFixed(suffix.includes("%") ? 1 : 0)}${suffix}`;
      }
    }, 30);
  }
};
export {
  HomeModule
};
