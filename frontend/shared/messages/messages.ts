export const Messages = {
    Common: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
        error: (msg: string) =>
            `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`,
        networkError: 'Error de conexión',
        sessionExpiredMsg: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        errorLoadingUI: (msg: string) => `Error cargando interfaz: ${msg}`,
        viewBtn: '<i class="fa-solid fa-eye"></i> Ver',
        saveBtn: '<i class="fa-solid fa-save"></i> Guardar',
        cancelBtn: '<i class="fa-solid fa-xmark"></i> Cancelar',
        connectionError: 'Error de conexión',
        welcome: (name: string) => `Bienvenido, ${name}`,
        spinner: (text: string) => `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`,
        dangerText: (text: string) =>
            `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${text}</span>`,
        emptyState: (icon: string, text: string) =>
            `<div class="empty-state"><i class="${icon}"></i><p>${text}</p></div>`
    }
};
