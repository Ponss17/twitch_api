var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/duel/messages.ts
var DuelMessages = {
  emptyTarget: "\u26A0\uFE0F Debes especificar un oponente.",
  fighting: '<i class="fa-solid fa-spinner fa-spin"></i> Peleando...',
  loading: '<div class="duel-loading"><i class="fa-solid fa-khanda fa-shake"></i> Calculando ganador...</div>',
  fightButton: '<i class="fa-solid fa-gavel"></i> \xA1DUELO!',
  error: /* @__PURE__ */ __name((msg) => `\u274C ${msg}`, "error")
};
export {
  DuelMessages
};
