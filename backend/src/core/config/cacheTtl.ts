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
    /** Feed de actividad del dashboard (polling / fallback sin Realtime) */
    ACTIVITY_FEED: 20,
    /** Listas de mods / VIPs / subs para ruleta */
    ELIGIBILITY: 60,
    /** Usuario por API key / id en Supabase */
    API_USER: 10 * 60,
    USER_BY_LOGIN: 15 * 60,
    TWITCH_USER_ID: 24 * 60 * 60,
    CHANNEL_INFO: 1800,
    /** Estado efímero del overlay OBS (ruleta / tendencias) */
    OVERLAY_STATE: 2 * 60 * 60
} as const;

export { resolveUserCacheTtl, DEFAULT_USER_CACHE_TTL } from './userRoles';

/** Aísla entradas KV por dueño de API key (evita mezclar TTL entre usuarios). */
export function ownerScopedCacheKey(userId: string | undefined, key: string): string {
    if (!userId) return key;
    return `${key}:owner:${userId}`;
}
