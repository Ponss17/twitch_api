var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { UI } from "../../core/ui.js";
import { Messages } from "../i18n/messages.js";
import { AuthMessages } from "../i18n/authMessages.js";
const _ErrorHandler = class _ErrorHandler {
  constructor() {
    this.isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    this.init();
  }
  init() {
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(String(message)), {
        source,
        lineno,
        colno
      });
      return true;
    };
    window.onunhandledrejection = (event) => {
      this.handleError(event.reason, {
        type: "unhandledRejection"
      });
      event.preventDefault();
    };
  }
  handleError(error, context = {}) {
    if (this.isDevelopment) {
      console.error("\u{1F534} Error capturado por ErrorHandler:", error);
      console.error("Contexto:", context);
    }
    const userMessage = this.getUserMessage(error);
    UI.showToast(userMessage, "error");
  }
  getUserMessage(error) {
    const msg = error instanceof Error ? error.message : String(error || "");
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
      return Messages.Common.networkError;
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg === "auth_error") {
      return AuthMessages.sessionExpired;
    }
    if (msg.includes("403") || msg.includes("forbidden")) {
      return AuthMessages.validationError;
    }
    return this.isDevelopment ? `Error: ${msg}` : Messages.Common.error("Algo sali\xF3 mal. Intenta de nuevo.");
  }
  reportError(error, context) {
    if (this.isDevelopment) {
      console.warn("Reported Error:", error, context);
    }
  }
};
__name(_ErrorHandler, "ErrorHandler");
let ErrorHandler = _ErrorHandler;
const errorHandler = new ErrorHandler();
export {
  errorHandler
};
