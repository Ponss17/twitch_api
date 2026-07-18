import { USER_ROLES, type UserRole } from './userRoles';

type CacheMatrixValue = { default: number; pro: number; vip: number; partner: number };

/**
 * Matriz de TTLs de caché KV (segundos) por recurso y rol.
 *
 * Premia con retención (más alto = menos carga Twitch): COMMAND
 * Premia con frescura (más bajo = datos más actuales): CLIPS, CHATTERS, dashboards, etc.
 */
export const CACHE_TTL_MATRIX = {
    /** Respuestas de comandos de bot — alineado con USER_ROLES.commandCacheTtl */
    COMMAND: {
        default: USER_ROLES.default.commandCacheTtl,
        pro: USER_ROLES.pro.commandCacheTtl,
        vip: USER_ROLES.vip.commandCacheTtl,
        partner: USER_ROLES.partner.commandCacheTtl
    },
    /** Stalker / ruleta (capa owner-scoped) */
    CHATTERS: { default: 45, pro: 30, vip: 20, partner: 10 },
    /** Clips del dashboard */
    CLIPS: { default: 60, pro: 45, vip: 30, partner: 15 },
    /** Perfil Twitch en summary */
    DASHBOARD_PROFILE: { default: 300, pro: 225, vip: 150, partner: 75 },
    /** Stats de Supabase en summary */
    DASHBOARD_ANALYTICS: { default: 60, pro: 45, vip: 30, partner: 15 },
    /** Analytics endpoint suelto */
    ANALYTICS: { default: 45, pro: 35, vip: 20, partner: 10 },
    /** Info de usuario para modal Stalker (perfil Twitch estable) */
    USER_INFO: { default: 3600, pro: 2700, vip: 1800, partner: 900 },
    /** Feed de actividad del dashboard */
    ACTIVITY_FEED: { default: 20, pro: 15, vip: 10, partner: 5 },
    /** Listas de mods / VIPs / subs para ruleta */
    ELIGIBILITY: { default: 90, pro: 60, vip: 40, partner: 20 },
    /** Infra interna — misma para todos (no es ventaja de producto) */
    API_USER: { default: 600, pro: 600, vip: 600, partner: 600 },
    USER_BY_LOGIN: { default: 900, pro: 900, vip: 900, partner: 900 },
    TWITCH_USER_ID: { default: 86400, pro: 86400, vip: 86400, partner: 86400 },
    CHANNEL_INFO: { default: 1800, pro: 1800, vip: 1800, partner: 1800 },
    OVERLAY_STATE: { default: 7200, pro: 7200, vip: 7200, partner: 7200 },
    /** Estado en vivo del canal en el panel */
    STREAM_LIVE: { default: 45, pro: 30, vip: 15, partner: 8 }
} satisfies Record<string, CacheMatrixValue>;

export type CacheResourceKey = keyof typeof CACHE_TTL_MATRIX;

/** Resuelve el TTL de la Matriz basado en el rol. Prioriza customTtl si existe. */
export function resolveCache(
    resourceKey: CacheResourceKey,
    role?: string | null,
    customTtl?: number
): number {
    if (typeof customTtl === 'number' && customTtl > 0) return customTtl;
    const normalizedRole =
        role && role in CACHE_TTL_MATRIX[resourceKey] ? (role as UserRole) : 'default';
    return CACHE_TTL_MATRIX[resourceKey][normalizedRole];
}

/** Aísla entradas KV por dueño de API key (evita mezclar TTL entre usuarios). */
export function ownerScopedCacheKey(userId: string | undefined, key: string): string {
    if (!userId) return key;
    return `${key}:owner:${userId}`;
}
