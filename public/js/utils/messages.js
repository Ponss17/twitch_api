export const Messages = {
    Common: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
        error: (msg) => `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`,
        networkError: 'Error de conexión',
        sessionExpired: 'Tu sesión ha expirado'
    },
    Stalker: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando Chat...',
        empty: `
            <div class="empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>Nadie en el chat (o error de conexión)</p>
            </div>
        `,
        reauthError: `
            <div class="error-msg" style="text-align: center; padding: 20px;">
                <i class="fa-solid fa-lock" style="font-size: 2rem; margin-bottom: 10px; color: var(--accent);"></i>
                <h3>Faltan Permisos</h3>
                <p>Para ver el chat, necesitas autorizar el acceso.</p>
                <button id="reauth-btn" class="btn-primary" style="margin-top: 10px;">
                    <i class="fa-brands fa-twitch"></i> Conectar de nuevo
                </button>
            </div>
        `,
        userInfo: (info) => `
            👤 ${info.display_name}
            📅 Creado: ${new Date(info.created_at).toLocaleDateString()}
            👁️ Vistas: ${info.view_count}
            📝 Bio: ${info.description || 'Sin bio'}
        `,
        loadError: 'No se pudo cargar info del usuario'
    },
    Settings: {
        testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando conexión...',
        testError: '⚠️ Error en la prueba de API',
        regenerateConfirm: '¿Generar una nueva API Key? La anterior dejará de funcionar.',
        regenerateSuccess: 'Nueva API Key generada',
        regenerateError: 'Error al generar Key',
        loadingIcon: '<i class="fa-solid fa-spinner fa-spin"></i>',
        rotateIcon: '<i class="fa-solid fa-rotate"></i>'
    },
    Clips: {
        loading: '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clips...</div>',
        empty: `
            <div class="empty-state">
                <i class="fa-solid fa-film"></i>
                <p>No hay clips recientes</p>
            </div>
        `,
        loadError: '⚠️ Error al cargar clips'
    },
    Tracker: {
        connected: '<span style="color:var(--success)"><i class="fa-solid fa-circle"></i> Conectado</span>',
        error: '<span style="color:var(--warning)"><i class="fa-solid fa-xmark"></i> Error</span>',
        waiting: '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando mensajes...</td></tr>',
        timeUp: '¡TIEMPO!'
    }
};
