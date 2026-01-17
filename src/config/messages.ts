export const MESSAGES = {
    AUTH: {
        NO_TOKEN: 'Token no proporcionado.',
        INVALID_TOKEN: 'Token inválido',
        VALIDATION_ERROR: 'Error validando token',
        UNKNOWN_ERROR: 'Unknown error',
        AUTH_ERROR: 'Error en autenticación:'
    },
    SYSTEM: {
        KEY_REQUIRED: 'Key requerida',
        USER_NOT_FOUND: 'Usuario no encontrado',
        REGENERATE_KEY_ERROR: 'Error regenerando clave',
        INTERNAL_CONFIG_ERROR: 'Error interno de configuración.'
    },
    FEEDBACK: {
        MESSAGE_REQUIRED: 'El mensaje es requerido.',
        SUCCESS: 'Feedback enviado correctamente.',
        SEND_ERROR: 'Error al enviar el feedback.'
    },
    AI: {
        PROMPT_REQUIRED: '¡Necesito que me digas algo! Cuak.',
        INTERNAL_ERROR: 'Error interno del pato.'
    },
    COMMANDS: {
        MISSING_CHANNEL: 'Falta el parámetro channel.',
        MISSING_PARAMS: 'Faltan parámetros: channel y user son requeridos.',
        MISSING_MESSAGE: 'Falta mensaje.',
        MISSING_LOGIN: 'Falta login.',
        CREATE_CLIP_ERROR: 'Error creando clip.',
        FOLLOWAGE_ERROR: 'Error verificando seguimiento.',
        SEND_MESSAGE_ERROR: 'Error enviando mensaje.'
    },
    DASHBOARD: {
        ANALYTICS_ERROR: 'Error recuperando analytics',
        CLIPS_ERROR: 'Error recuperando clips.',
        CHATTERS_ERROR: 'Error recuperando chatters',
        USER_INFO_ERROR: 'Error recuperando info de usuario'
    }
};
