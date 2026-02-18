import { UIMessages } from "../shared/i18n/uiMessages.js";
const UI = {
  clipboardInitialized: false,
  escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  },
  showToast(message, type = "success", customIcon) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "alert");
    const icon = customIcon || (type === "success" ? "fa-check-circle" : "fa-triangle-exclamation");
    toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> <span></span>`;
    const textSpan = toast.querySelector("span");
    textSpan.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hiding");
      toast.addEventListener("animationend", () => {
        if (toast.parentElement) {
          toast.remove();
        }
      });
    }, 4e3);
  },
  copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`<i class="fa-solid fa-check"></i> ${UIMessages.Clipboard.copied}`);
    }).catch(() => {
      this.showToast(
        `<i class="fa-solid fa-xmark"></i> ${UIMessages.Clipboard.error}`,
        "error"
      );
    });
  },
  setupClipboard() {
    if (this.clipboardInitialized) return;
    this.clipboardInitialized = true;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const targetId = btn.dataset.target;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          const valueToCopy = target.dataset.realValue || target.value || target.innerText;
          this.copyToClipboard(valueToCopy);
        }
      }
    });
  },
  setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.classList.add("btn-loading");
      button.disabled = true;
      button.dataset.originalText = button.textContent || "";
    } else {
      button.classList.remove("btn-loading");
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  },
  disableButton(button) {
    if (!button) return;
    button.disabled = true;
    button.classList.add("btn-disabled");
  },
  enableButton(button) {
    if (!button) return;
    button.disabled = false;
    button.classList.remove("btn-disabled");
  },
  setCardLoading(card, isLoading) {
    if (!card) return;
    if (isLoading) {
      card.classList.add("card-loading");
    } else {
      card.classList.remove("card-loading");
    }
  },
  animateValue(obj, start, end, duration = 1500) {
    if (start === end) {
      obj.innerHTML = end.toString();
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      obj.innerHTML = Math.floor(easeProgress * (end - start) + start).toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }
};
export {
  UI
};
