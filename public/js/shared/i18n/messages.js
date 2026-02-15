const Messages = {
  Common: {
    loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
    error: (msg) => `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`,
    networkError: "Error de conexi\xF3n",
    sessionExpiredMsg: "Tu sesi\xF3n ha expirado. Por favor, inicia sesi\xF3n de nuevo.",
    errorLoadingUI: (msg) => `Error cargando interfaz: ${msg}`,
    viewBtn: '<i class="fa-solid fa-eye"></i> Ver',
    saveBtn: '<i class="fa-solid fa-save"></i> Guardar',
    cancelBtn: '<i class="fa-solid fa-xmark"></i> Cancelar',
    connectionError: "Error de conexi\xF3n",
    welcome: (name) => `Bienvenido, ${name}`
  }
};
export {
  Messages
};
