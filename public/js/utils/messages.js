export const Messages = {
    Auth: {
        sessionExpired: "Tu sesión ha expirado",
        validationError: "Error al validar sesión",
        sessionError: "Error de sesión. Recarga la página.",
        expiredTitle: "Sesión Expirada",
        expiredMsg: "Tu credencial ha caducado. Por favor, inicia sesión de nuevo.",
        reloginBtn: '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión',
        expired: "Sesión expirada. Por favor, inicia sesión de nuevo."
    },
    Feedback: {
        emptyMessage: "Por favor, escribe un mensaje.",
        sending: '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...',
        defaultButton: '<i class="fa-solid fa-paper-plane"></i> Enviar Feedback',
        success: "¡Feedback enviado! Gracias por tu aporte.",
        error: "Error al enviar. Intenta más tarde.",
        connectionError: "Error de conexión."
    },
    Clipboard: {
        copied: "¡Copiado!",
        error: "Error al copiar"
    },
    Common: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...',
        error: (msg) => `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`,
        networkError: 'Error de conexión',
        sessionExpiredMsg: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        errorLoadingUI: (msg) => `Error cargando interfaz: ${msg}`,
        viewBtn: '<i class="fa-solid fa-eye"></i> Ver',
        saveBtn: '<i class="fa-solid fa-save"></i> Guardar',
        cancelBtn: '<i class="fa-solid fa-xmark"></i> Cancelar',
        connectionError: 'Error de conexión'
    },
    Stalker: {
        loading: '<i class="fa-solid fa-spinner fa-spin"></i> Cargando Chat...',
        empty: `
            <div class="empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>Nadie en el chat (o error de conexión)</p>
            </div>
        `,
        waiting: `
            <div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div>
            <h3>Esperando señal...</h3>
            <p>Dale al botón <strong>Play</strong> para comenzar a escanear el chat.</p>
        `,
        syncNote: '* Lista sincronizada con API + Chat en vivo',
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
        updated: '<i class="fa-solid fa-check"></i> Lista Stalker recargada',
        updatedRaw: 'Lista Stalker recargada',
        bioEmpty: 'Sin biografía disponible.',
        apiError: 'Error API',
        infoError: 'No se pudo cargar info del usuario',
        reloginMsg: 'Necesitas re-login (Permisos)',
        loadError: 'No se pudo cargar info del usuario',
        scanStarted: '<i class="fa-solid fa-satellite-dish fa-beat" style="--fa-beat-scale: 1.2;"></i> Escaneo iniciado',
        scanStartedRaw: 'Escaneo iniciado',
        scanPaused: '<i class="fa-solid fa-snowflake" style="color:#00f2ea"></i> Vista Congelada (Pausado)',
        scanPausedRaw: 'Vista Congelada (Pausado)'
    },
    Settings: {
        testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando conexión...',
        testError: '⚠️ Error en la prueba de API',
        regenerateConfirm: '¿Generar una nueva API Key? La anterior dejará de funcionar inmediatamente.',
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
        waiting: '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando palabras...</td></tr>',
        timeUp: '¡TIEMPO!',
        started: (min) => `<i class="fa-solid fa-hourglass-start fa-spin"></i>  Tracker iniciado (${min} min)`,
        startedRaw: (min) => `Tracker iniciado (${min} min)`,
        finished: '<i class="fa-solid fa-flag-checkered"></i> ¡Tiempo terminado!',
        finishedRaw: '¡Tiempo terminado!',
        winner: (word, count) => `👑 Ganador: <strong>"${word}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`,
        resting: '<i class="fa-solid fa-power-off"></i> Reposo',
        ready: `
            <tr>
                <td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <div style="font-size:2rem; margin-bottom:10px;"><i class="fa-solid fa-play"></i></div>
                    <h4 style="color:var(--text-primary); margin-bottom:5px;">Listo para analizar</h4>
                    <p>Presiona el botón <strong>Play</strong> para comenzar a contar palabras.</p>
                </td>
            </tr>
        `,
    },
    Roulette: {
        updated: '<i class="fa-solid fa-check"></i> Lista actualizada',
        updatedRaw: 'Lista actualizada',
        noParticipants: 'No hay participantes',
        emptyWheel: 'Sin participantes',
        winner: (name) => `¡Ganador: ${name} 🎉!`,
        open: '<i class="fa-solid fa-door-open"></i> Inscripciones Abiertas',
        openRaw: 'Inscripciones Abiertas',
        closed: '<i class="fa-solid fa-door-closed"></i> Inscripciones Cerradas',
        closedRaw: 'Inscripciones Cerradas',
        playToOpen: "Dale al Play ▶️ para abrir"
    },
    Commands: {
        clipResponse: (user, url) => `🎬 Clip creado por ${user}: ${url}`,
        followageResponse: 'Procesando followage...',
        missingCreds: 'Faltan credenciales',
        completeFields: 'Por favor, completa ambos campos.',
        testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
        connectionError: '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión</span>',
        success: (text) => `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`,
        error: (text) => `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`
    },
    Analytics: {
        loadError: 'No se pudieron cargar las estadísticas',
        loading: '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i></div>',
        errorState: '<div class="error-state"><i class="fa-solid fa-triangle-exclamation"></i> Error cargando estadísticas</div>'
    },
    Trends: {
        title: (channel) => `Tendencias de ${channel}`,
        noTmi: 'TMI.js no cargado'
    },
    Magic8: {
        emptyQuestion: '⚠️ Debes hacer una pregunta primero.',
        consulting: '<i class="fa-solid fa-spinner fa-spin"></i> Consultando...',
        loading: '<div class="magic8-loading"><i class="fa-solid fa-crystal-ball fa-beat"></i> Consultando a los espíritus...</div>',
        askButton: '<i class="fa-solid fa-play"></i> Preguntar',
        error: (msg) => `❌ ${msg}`
    },
    Details: {
        partner: 'Socio',
        affiliate: 'Afiliado',
        user: 'Usuario',
        created: (date) => `Cuenta creada el: ${new Date(date).toLocaleDateString()}`,
        new: 'Nueva',
        years: (y) => `${y} año${y > 1 ? 's' : ''}`,
        months: (m) => `${m} meses`,
        viewLogs: '<i class="fa-solid fa-comment-dots"></i> Ver Últimos Mensajes',
        historyTitle: '<i class="fa-solid fa-history"></i> Historial (Sesión actual)',
        noHistory: 'No hay mensajes registrados en esta sesión.'
    },
    ChatSim: {
        welcome: "¡Bienvenido al chat!",
        placeholder: "Enviar un mensaje",
        btnText: "Chat",
        followage: (user, channel, time) => `@${user} sigue a @${channel} desde hace ${time}.`,
        clip: (user, url) => `🎬 Clip creado por <span style="color:#FF69B4">@${user}</span>: ${url}`,
        shoutout: (user, game) => `¡Vayan a seguir a <span style="color:#bf94ff">@${user}</span>! Estaba jugando ${game}`
    }
};
