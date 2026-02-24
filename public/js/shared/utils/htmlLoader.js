var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// frontend/shared/i18n/messages.ts
var messages_exports = {};
__export(messages_exports, {
  Messages: () => Messages
});
var Messages;
var init_messages = __esm({
  "frontend/shared/i18n/messages.ts"() {
    "use strict";
    Messages = {
      Common: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
        error: /* @__PURE__ */ __name((msg) => `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`, "error"),
        networkError: "Error de conexi\xF3n",
        sessionExpiredMsg: "Tu sesi\xF3n ha expirado. Por favor, inicia sesi\xF3n de nuevo.",
        errorLoadingUI: /* @__PURE__ */ __name((msg) => `Error cargando interfaz: ${msg}`, "errorLoadingUI"),
        viewBtn: '<i class="fa-solid fa-eye"></i> Ver',
        saveBtn: '<i class="fa-solid fa-save"></i> Guardar',
        cancelBtn: '<i class="fa-solid fa-xmark"></i> Cancelar',
        connectionError: "Error de conexi\xF3n",
        welcome: /* @__PURE__ */ __name((name) => `Bienvenido, ${name}`, "welcome")
      }
    };
  }
});

// frontend/shared/utils/htmlLoader.ts
var HtmlLoader = {
  cache: /* @__PURE__ */ new Map(),
  async load(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.dataset.loaded === "true") return;
    try {
      let html = "";
      if (this.cache.has(url)) {
        html = this.cache.get(url);
      } else {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        html = await res.text();
        this.cache.set(url, html);
      }
      container.innerHTML = html;
      container.dataset.loaded = "true";
      document.dispatchEvent(
        new CustomEvent("html-loaded", { detail: { url, containerId } })
      );
    } catch (error) {
      console.error("[HtmlLoader] Error:", error);
      const { Messages: Messages2 } = await Promise.resolve().then(() => (init_messages(), messages_exports));
      container.innerHTML = `<div class="error-state">${Messages2.Common.errorLoadingUI(url)}</div>`;
    }
  }
};
export {
  HtmlLoader
};
