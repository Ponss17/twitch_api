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
        INVALID_CREDENTIALS:
            '⛔ Tu API Key no es válida. Regenerala en el dashboard o contacta con Ponss.',
        MISSING_TOKEN_URL: 'Error: Falta API Key. Debes incluir ?apiKey=TU_KEY en la URL.',
        API_KEY_REQUIRED:
            '🔑 API Key requerida. Obtén tu llave en el Dashboard para usar esta ruta.',
        RATE_LIMIT_EXCEEDED: '⚠️ Has excedido el límite de peticiones. Por favor, espera un minuto.',
        SESSION_EXPIRED:
            'Sesión expirada. Por favor, vuelve a autenticarte o pide ayuda a Ponss 🦆'
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
    MAGIC8: {
        QUESTION_REQUIRED: 'Debes hacer una pregunta a la Bola 8 Mágica.',
        QUESTION_TOO_SHORT: 'La pregunta es demasiado corta.',
        QUESTION_TOO_LONG: 'La pregunta es demasiado larga (max 500 caracteres).',
        GROQ_ERROR: 'La Bola 8 Mágica está descansando. Intenta de nuevo.',
        MISSING_API_KEY: 'La Bola 8 Mágica no está configurada (falta GROQ_API_KEY).'
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
        SHOUTOUT_HEADLINE: '¡Vayan a seguir a {user}! Estaba jugando {game}',
        RUSSIAN_ERROR: 'Error interno en la Ruleta Rusa.',
        DUEL_ERROR: 'Error al iniciar el duelo.',
        MISSING_OPPONENT: 'Debes especificar un oponente (@usuario).'
    },
    DASHBOARD: {
        ANALYTICS_ERROR: 'Error recuperando analytics',
        CLIPS_ERROR: 'Error recuperando clips.',
        CHATTERS_ERROR: 'Error recuperando chatters',
        USER_INFO_ERROR: 'Error recuperando info de usuario',
        LOGS_ERROR: 'Error recuperando actividad'
    }
};
