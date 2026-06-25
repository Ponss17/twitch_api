/** TTLs de caché KV (segundos). Centralizados para ajustar sin tocar lógica de negocio. */
export const CACHE_TTL = {
    /** Respuestas de comandos de bot (followage, etc.) */
    COMMAND: 60,
    /** Lista de chatters / Stalker */
    CHATTERS: 30,
    /** Clips del dashboard */
    CLIPS: 60,
    /** Perfil Twitch en summary (avatar, followers — cambia poco) */
    DASHBOARD_PROFILE: 5 * 60,
    /** Stats de Supabase en summary (polling ~90s en Home) */
    DASHBOARD_ANALYTICS: 60,
    /** Analytics endpoint suelto (fallback) */
    ANALYTICS: 45,
    /** Info de usuario para modal Stalker */
    USER_INFO: 3600,
    /** Usuario por API key / id en Supabase */
    API_USER: 10 * 60,
    USER_BY_LOGIN: 15 * 60,
    TWITCH_USER_ID: 24 * 60 * 60,
    CHANNEL_INFO: 1800
} as const;
