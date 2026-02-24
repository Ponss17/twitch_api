var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const CommandsMessages = {
  clipResponse: /* @__PURE__ */ __name((user, url) => `\u{1F3AC} Clip creado por ${user}: ${url}`, "clipResponse"),
  followageResponse: "Procesando followage...",
  missingCreds: "Faltan credenciales",
  completeFields: "\u26A0\uFE0F Por favor, ingresa el Canal y el Usuario para probar.",
  testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
  connectionError: '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexi\xF3n</span>',
  success: /* @__PURE__ */ __name((text) => `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`, "success"),
  error: /* @__PURE__ */ __name((text) => `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`, "error"),
  form: {
    customMessage: "Mensaje Personalizado (Opcional)",
    variables: "Variables:",
    selectBot: "Selecciona tu bot:",
    copyBtn: "Copiar"
  }
};
export {
  CommandsMessages
};
