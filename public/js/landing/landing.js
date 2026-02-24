var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { Auth } from "../core/auth.js";
import { LandingUI } from "./ui-landing.js";
import { HeaderComponent } from "../shared/components/header.js";
import { FooterComponent } from "../shared/components/footer.js";
function setupFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question?.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });
      if (isActive) {
        item.classList.remove("active");
      } else {
        item.classList.add("active");
      }
    });
  });
}
__name(setupFAQ, "setupFAQ");
document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("disclaimer-modal");
  const loginBtn = document.getElementById("login-btn");
  const confirmBtn = document.getElementById("confirm-login-btn");
  const cancelBtn = document.getElementById("cancel-login-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const disclaimerText = document.querySelector(".disclaimer");
  const showModal = /* @__PURE__ */ __name(() => {
    if (modal) {
      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.style.display = "block";
      }
    }
  }, "showModal");
  const closeModal = /* @__PURE__ */ __name(() => {
    if (modal) {
      if (typeof modal.close === "function") {
        modal.close();
      } else {
        modal.style.display = "none";
      }
    }
  }, "closeModal");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showModal();
    });
  }
  if (disclaimerText) {
    disclaimerText.addEventListener("click", () => {
      showModal();
    });
    disclaimerText.style.cursor = "pointer";
    disclaimerText.title = "Ver detalles de privacidad";
  }
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      const icon = confirmBtn.querySelector("i");
      if (icon) {
        icon.className = "fa-solid fa-spinner fa-spin";
      }
      confirmBtn.style.opacity = "0.8";
      confirmBtn.style.pointerEvents = "none";
      Auth.relogin();
    });
  }
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
  const heroCode = document.getElementById("hero-code-display");
  if (heroCode) LandingUI.setupHeroAnimation(heroCode);
  HeaderComponent.render("main-header");
  FooterComponent.render("main-footer");
  setupFAQ();
  const header = document.getElementById("main-header");
  const handleScroll = /* @__PURE__ */ __name(() => {
    if (window.scrollY > 50) {
      header?.classList.add("scrolled");
    } else {
      header?.classList.remove("scrolled");
    }
  }, "handleScroll");
  window.addEventListener("scroll", handleScroll);
  handleScroll();
  const sessionParams = Auth.parseUrlParams();
  if (sessionParams.token || sessionParams.apiKey) {
    const query = window.location.search;
    window.location.href = query ? `./dashboard${query}` : "./dashboard";
  }
});
