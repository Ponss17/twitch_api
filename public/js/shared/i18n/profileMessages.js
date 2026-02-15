const ProfileMessages = {
  partner: "Socio",
  affiliate: "Afiliado",
  user: "Usuario",
  created: (date) => `Cuenta creada el: ${new Date(date).toLocaleDateString()}`,
  new: "Nueva",
  years: (y) => `${y} a\xF1o${y > 1 ? "s" : ""}`,
  months: (m) => `${m} meses`,
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
