var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/features/dashboard/roulette/messages.ts
var RouletteMessages = {
  updated: '<i class="fa-solid fa-check"></i> Lista actualizada',
  updatedRaw: "Lista actualizada",
  noParticipants: "No hay participantes",
  emptyWheel: "Sin participantes",
  winner: /* @__PURE__ */ __name((name, count) => `\u{1F451} Ganador: <strong>"${name}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`, "winner"),
  open: '<i class="fa-solid fa-door-open"></i> Inscripciones Abiertas',
  openRaw: "Inscripciones Abiertas",
  closed: '<i class="fa-solid fa-door-closed"></i> Inscripciones Cerradas',
  closedRaw: "Inscripciones Cerradas",
  playToOpen: "Dale al Play \u25B6\uFE0F para abrir"
};
export {
  RouletteMessages
};
