import { UI } from "./ui.js";
import { HtmlLoader } from "../shared/utils/htmlLoader.js";
import { HomeModule } from "../features/dashboard/home.js";
import { AnalyticsModule } from "../features/dashboard/analytics.js";
import { CommandsModule } from "../features/dashboard/commands.js";
import { ClipsModule } from "../features/dashboard/clips.js";
import { TrendsModule } from "../features/dashboard/trends.js";
import { StalkerModule } from "../features/dashboard/stalker.js";
import { Magic8Module } from "../features/dashboard/magic8.js";
import { RouletteModule } from "../features/dashboard/roulette.js";
import { RussianModule } from "../features/dashboard/russian/module.js";
import { DuelModule } from "../features/dashboard/duel/module.js";
import { FeedbackModule } from "../features/dashboard/feedback.js";
const Dashboard = {
  session: null,
  activeModules: [],
  async init(session) {
    this.session = session;
    this.setupTabs();
    this.setupUserBadge();
    await this.preloadAllTabs();
    this.initAllModules();
    this.loadTab("tab-home");
  },
  async preloadAllTabs() {
    const panes = document.querySelectorAll(".tab-pane");
    const tasks = Array.from(panes).map((pane) => {
      if (pane instanceof HTMLElement && pane.dataset.src) {
        return HtmlLoader.load(pane.dataset.src, pane.id);
      }
      return Promise.resolve();
    });
    await Promise.all(tasks);
  },
  initAllModules() {
    if (!this.session) return;
    const modules = [
      HomeModule,
      AnalyticsModule,
      CommandsModule,
      ClipsModule,
      TrendsModule,
      StalkerModule,
      Magic8Module,
      RouletteModule,
      RussianModule,
      DuelModule,
      FeedbackModule
    ];
    modules.forEach((mod) => {
      if (mod && typeof mod.init === "function") {
        try {
          mod.init(this.session);
        } catch (e) {
          console.warn("Error initializing module:", e);
        }
      }
    });
  },
  setupUserBadge() {
    if (!this.session) return;
    const { displayName, profile_image_url } = this.session;
    const avatar = document.getElementById("user-avatar");
    const name = document.getElementById("user-display-name");
    if (avatar instanceof HTMLImageElement && profile_image_url) {
      avatar.src = profile_image_url;
      avatar.style.display = "block";
    }
    if (name && displayName) {
      name.innerText = displayName;
    }
    this.updatePageTitle("tab-home");
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      import("./auth.js").then((m) => m.Auth.logout());
    });
  },
  updatePageTitle(tabId) {
    const pageTitle = document.getElementById("page-title");
    if (!pageTitle) return;
    const titleMap = {
      "tab-home": "Inicio",
      "tab-followage": "Followage",
      "tab-clips": "Clips",
      "tab-shoutout": "Shoutout",
      "tab-tracker": "Tendencias",
      "tab-stalker": "Stalker",
      "tab-magic8": "Bola 8 M\xE1gica",
      "tab-roulette": "Ruleta",
      "tab-russian": "Ruleta Rusa",
      "tab-duel": "Duelo",
      "tab-feedback": "Feedback"
    };
    const title = titleMap[tabId] || "Dashboard";
    if (tabId === "tab-home" && this.session) {
      const { displayName } = this.session;
      const safeDisplayName = UI.escapeHTML(displayName || "Streamer");
      const safeLogin = UI.escapeHTML(this.session.login || "");
      const welcomeMsg = `Dashboard de <a href="https://twitch.tv/${safeLogin}" target="_blank" class="welcome-link">${safeDisplayName}</a>`;
      pageTitle.innerHTML = welcomeMsg;
    } else {
      pageTitle.textContent = title;
    }
  },
  setupTabs() {
    const tabs = document.querySelectorAll(".nav-item");
    tabs.forEach((tab) => {
      const htmlTab = tab;
      htmlTab.addEventListener("click", () => {
        if (htmlTab.classList.contains("external-link")) return;
        tabs.forEach((t) => t.classList.remove("active"));
        htmlTab.classList.add("active");
        document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
        const tabId = htmlTab.dataset.tab;
        const pane = document.getElementById(tabId);
        if (pane) pane.classList.add("active");
        this.loadTab(tabId);
      });
    });
  },
  loadTab(tabId) {
    if (!this.session) return;
    this.updatePageTitle(tabId);
    this.activeModules.forEach((mod) => {
      if (mod && typeof mod.deactivate === "function") {
        try {
          mod.deactivate();
        } catch (error) {
          console.error("Error al desactivar m\xF3dulo:", error);
        }
      }
    });
    this.activeModules = [];
    const moduleMap = {
      "tab-home": [HomeModule, AnalyticsModule],
      "tab-followage": [CommandsModule],
      "tab-clips": [ClipsModule, CommandsModule],
      "tab-shoutout": [CommandsModule],
      "tab-tracker": [TrendsModule],
      "tab-stalker": [StalkerModule],
      "tab-magic8": [Magic8Module, CommandsModule],
      "tab-roulette": [RouletteModule],
      "tab-russian": [RussianModule, CommandsModule],
      "tab-duel": [DuelModule, CommandsModule],
      "tab-feedback": [FeedbackModule]
    };
    if (moduleMap[tabId]) {
      this.activeModules = moduleMap[tabId];
      this.activeModules.forEach((mod) => {
        if (mod && typeof mod.activate === "function") {
          mod.activate();
        }
      });
    }
  }
};
export {
  Dashboard
};
