var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const ProfileMessages = {
  partner: "Socio",
  affiliate: "Afiliado",
  user: "Usuario",
  created: /* @__PURE__ */ __name((date) => `Cuenta creada el: ${new Date(date).toLocaleDateString()}`, "created"),
  new: "Nueva",
  years: /* @__PURE__ */ __name((y) => `${y} a\xF1o${y > 1 ? "s" : ""}`, "years"),
  months: /* @__PURE__ */ __name((m) => `${m} meses`, "months"),
  viewLogs: '<i class="fa-solid fa-comment-dots"></i> Ver \xDAltimos Mensajes',
  historyTitle: '<i class="fa-solid fa-history"></i> Historial (Sesi\xF3n actual)',
  noHistory: "No hay mensajes registrados en esta sesi\xF3n.",
  bioEmpty: "Sin biograf\xEDa disponible.",
  labels: {
    rank: "Rango",
    userId: "ID de Usuario",
    age: "Antig\xFCedad"
  }
};
export {
  ProfileMessages
};
