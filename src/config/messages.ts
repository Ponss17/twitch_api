export const MESSAGES = {
    AUTH: {
        NO_TOKEN: 'Token no proporcionado.',
        INVALID_TOKEN: 'Token inválido',
        VALIDATION_ERROR: 'Error validando token',
        UNKNOWN_ERROR: 'Error desconocido',
        AUTH_ERROR: 'Error en autenticación:',
        NO_REFRESH_TOKEN: 'Usuario no encontrado o sin refresh token',
        RENEW_ERROR: 'No se pudo renovar el token. Relogueate.',
        INVALID_KEY: 'API Key inválida',
        USER_NOT_FOUND: 'Usuario no encontrado',
        INVALID_CREDENTIALS: '⛔ Error: Credenciales inválidas. Verifica tu API Key.',
        MISSING_TOKEN_URL: 'Error: Token no proporcionado. Debes incluir ?token=TU_TOKEN en la URL.'
    },
    SYSTEM: {
        KEY_REQUIRED: 'Key requerida',
        USER_NOT_FOUND: 'Usuario no encontrado',
        UNAUTHORIZED: 'Acceso no autorizado',
        REGENERATE_KEY_ERROR: 'Error regenerando clave',
        INTERNAL_CONFIG_ERROR: 'Error interno de configuración.'
    },
    FEEDBACK: {
        MESSAGE_REQUIRED: 'El mensaje es requerido.',
        SUCCESS: 'Feedback enviado correctamente.',
        SEND_ERROR: 'Error al enviar el feedback.',
        MESSAGE_TOO_LONG: 'Mensaje demasiado largo (max 2000 caracteres).',
        ANONYMOUS_USER: 'Anónimo',
        VIEWER_ROLE: '📺 Viewer',
        EMBED_TITLE: '📢 Nuevo Feedback',
        EMBED_FOOTER: 'LosPerris Twitch Api - FeedBack'
    },
    AI: {
        PROMPT_REQUIRED: '¡Necesito que me digas algo! Cuak.',
        INTERNAL_ERROR: 'Error interno del pato.',
        MISSING_KEY: 'No estoy configurado (Falta API Key). ¡Cuak!',
        BRAIN_ERROR: 'Algo salió mal en mi cerebro de pato.'
    },
    COMMANDS: {
        MISSING_CHANNEL: 'Falta el parámetro channel.',
        MISSING_PARAMS: 'Faltan parámetros: channel y user son requeridos.',
        MISSING_MESSAGE: 'Falta mensaje.',
        MISSING_LOGIN: 'Falta login.',
        CREATE_CLIP_ERROR: 'Error creando clip.',
        FOLLOWAGE_ERROR: 'Error verificando seguimiento.',
        SEND_MESSAGE_ERROR: 'Error enviando mensaje.',
        MESSAGE_TOO_LONG: 'Mensaje demasiado largo (max 500 caracteres).',
        SHOUTOUT_ERROR: 'Error generando shoutout.',
        SHOUTOUT_HEADLINE: '¡Vayan a seguir a {user}! Estaba jugando {game}'
    },
    DASHBOARD: {
        ANALYTICS_ERROR: 'Error recuperando analytics',
        CLIPS_ERROR: 'Error recuperando clips.',
        CHATTERS_ERROR: 'Error recuperando chatters',
        USER_INFO_ERROR: 'Error recuperando info de usuario'
    }
};
