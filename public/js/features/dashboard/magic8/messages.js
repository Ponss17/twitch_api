var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/magic8/messages.ts
var Magic8Messages = {
  emptyQuestion: "\u26A0\uFE0F Debes hacer una pregunta primero.",
  consulting: '<i class="fa-solid fa-spinner fa-spin"></i> Consultando...',
  loading: '<div class="magic8-loading"><i class="fa-solid fa-crystal-ball fa-beat"></i> Consultando a los esp\xEDritus...</div>',
  askButton: '<i class="fa-solid fa-play"></i> Preguntar',
  error: /* @__PURE__ */ __name((msg) => `\u274C ${msg}`, "error")
};
export {
  Magic8Messages
};
