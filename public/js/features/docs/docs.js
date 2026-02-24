var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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

// frontend/features/docs/docs.ts
document.addEventListener("DOMContentLoaded", () => {
  const mobileToggle = document.querySelector(".mobile-nav-toggle");
  const sidebar = document.querySelector(".sidebar");
  const navItems = document.querySelectorAll(".nav-item");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      const icon = mobileToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-xmark");
      }
    });
    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        sidebar.classList.remove("active");
        if (mobileToggle) {
          const icon = mobileToggle.querySelector("i");
          if (icon) {
            icon.classList.add("fa-bars");
            icon.classList.remove("fa-xmark");
          }
        }
      });
    });
  }
  const searchInput = document.getElementById("docs-search");
  const sections = document.querySelectorAll(".doc-section");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = e.target;
      const query = target.value.toLowerCase();
      sections.forEach((section) => {
        const text = section.textContent?.toLowerCase() || "";
        const id = section.getAttribute("id");
        const navItem = document.querySelector(`.nav-item[href="#${id}"]`);
        if (text.includes(query)) {
          section.style.display = "block";
          if (navItem) navItem.style.display = "flex";
        } else {
          section.style.display = "none";
          if (navItem) navItem.style.display = "none";
        }
      });
      const subSections = document.querySelectorAll(".nav-subsection");
      subSections.forEach((sub) => {
        const visibleItems = sub.querySelectorAll('.nav-item[style*="display: flex"]');
        const hasVisible = visibleItems.length > 0;
        sub.style.display = hasVisible ? "block" : "none";
      });
      if (!query) {
        sections.forEach((s) => s.style.display = "block");
        document.querySelectorAll(".nav-item").forEach((n) => n.style.display = "flex");
        document.querySelectorAll(".nav-subsection").forEach((n) => n.style.display = "block");
      }
    });
  }
  FooterComponent.render("main-footer");
  const observerOptions = {
    root: null,
    rootMargin: "-15% 0px -65% 0px",
    threshold: 0
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        if (!id) return;
        navItems.forEach((item) => {
          const el = item;
          el.classList.remove("active");
          if (el.getAttribute("href") === `#${id}`) {
            el.classList.add("active");
          }
        });
      }
    });
  }, observerOptions);
  sections.forEach((section) => observer.observe(section));
  const COMMAND_PREFIXES = {
    nightbot: "!addcom {trigger} ",
    streamelements: "!command add {trigger} ",
    fossabot: "!addcom {trigger} "
  };
  function updateCodeBlock(container, format) {
    const activeTab = container.querySelector(".tab-content.active");
    if (!activeTab) return;
    const botName = activeTab.dataset.bot || "";
    const codeElement = activeTab.querySelector(".dynamic-url");
    const originalPath = codeElement.dataset.path || "";
    const trigger = container.dataset.trigger;
    const baseUrl = window.location.origin;
    let finalCode = originalPath.includes("{baseURL}") ? originalPath.replace("{baseURL}", baseUrl) : `$(urlfetch ${baseUrl}${originalPath})`;
    if (format === "chat" && trigger && COMMAND_PREFIXES[botName]) {
      const prefix = COMMAND_PREFIXES[botName].replace("{trigger}", trigger);
      finalCode = prefix + finalCode;
    }
    try {
      const sessionData = localStorage.getItem("twitch_dashboard_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.apiKey) {
          finalCode = finalCode.replace(/TU_API_KEY/g, session.apiKey);
        }
      }
    } catch (e) {
      console.warn("Session error", e);
    }
    codeElement.textContent = finalCode;
    const copyBtn = activeTab.querySelector(".btn-copy-doc");
    if (copyBtn) {
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyBtn.classList.remove("success");
    }
  }
  __name(updateCodeBlock, "updateCodeBlock");
  window.switchFormat = (btn, format) => {
    const container = btn.closest(".code-tab-container");
    container.querySelectorAll(".format-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    updateCodeBlock(container, format);
  };
  window.switchTab = (btn, botName) => {
    const container = btn.closest(".code-tab-container");
    container.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    container.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    const targetTab = container.querySelector(`.tab-content[data-bot="${botName}"]`);
    if (targetTab) targetTab.classList.add("active");
    const activeFormatBtn = container.querySelector(".format-btn.active");
    const currentFormat = activeFormatBtn ? activeFormatBtn.textContent?.trim() === "Chat" ? "chat" : "dashboard" : "dashboard";
    updateCodeBlock(container, currentFormat);
  };
  window.copyCode = (btn) => {
    const codeElement = btn.parentElement?.querySelector("code");
    const code = codeElement?.textContent || "";
    navigator.clipboard.writeText(code).then(() => {
      const originalIcon = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      btn.classList.add("success");
      setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.classList.remove("success");
      }, 2e3);
    });
  };
  setTimeout(() => {
    document.querySelectorAll(".code-tab-container").forEach((c) => updateCodeBlock(c, "chat"));
  }, 100);
});
