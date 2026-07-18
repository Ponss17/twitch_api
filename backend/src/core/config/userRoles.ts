/**
 * Roles de usuario de la API y sus ventajas reales.
 *
 * - rateLimit: peticiones/min con API key (bots / integraciones)
 * - heavyLimit: peticiones/min a endpoints caros (clips, chatters) con API key
 * - commandCacheTtl: retención de respuestas de comandos de bot (más alto = menos hits a Twitch)
 */

export const USER_ROLES = {
    default: {
        label: 'Default',
        rateLimit: 30,
        heavyLimit: 5,
        commandCacheTtl: 60
    },
    pro: {
        label: 'Pro',
        rateLimit: 60,
        heavyLimit: 12,
        commandCacheTtl: 80
    },
    vip: {
        label: 'VIP',
        rateLimit: 90,
        heavyLimit: 20,
        commandCacheTtl: 120
    },
    partner: {
        label: 'Partner',
        rateLimit: 120,
        heavyLimit: 40,
        commandCacheTtl: 240
    }
} as const;

export type UserRole = keyof typeof USER_ROLES;

export const DEFAULT_USER_ROLE: UserRole = 'default';

export interface UserLimitsSource {
    role?: string | null;
    customRateLimit?: number;
    customCacheTtl?: number;
}

export interface ResolvedUserLimits {
    role: UserRole;
    roleLabel: string;
    rateLimit: number;
    heavyLimit: number;
    cacheTtl: number;
    hasCustomRateLimit: boolean;
    hasCustomCacheTtl: boolean;
}

export function normalizeUserRole(role?: string | null): UserRole {
    if (!role) return DEFAULT_USER_ROLE;
    const lowerRole = role.toLowerCase();
    if (lowerRole in USER_ROLES) return lowerRole as UserRole;
    return DEFAULT_USER_ROLE;
}

function getRoleConfig(role?: string | null) {
    return USER_ROLES[normalizeUserRole(role)];
}

/** Prioridad: personalizado → rol → default global. */
export function resolveUserRateLimit(user?: UserLimitsSource | null): number {
    const custom = user?.customRateLimit;
    if (typeof custom === 'number' && custom > 0) return custom;
    return getRoleConfig(user?.role).rateLimit;
}

/** Cuota de endpoints pesados (clips/chatters) por rol. */
export function resolveUserHeavyLimit(user?: UserLimitsSource | null): number {
    return getRoleConfig(user?.role).heavyLimit;
}

export function resolveUserLimits(user?: UserLimitsSource | null): ResolvedUserLimits {
    const role = normalizeUserRole(user?.role);
    const roleConfig = USER_ROLES[role];
    const hasCustomRateLimit =
        typeof user?.customRateLimit === 'number' && user.customRateLimit > 0;
    const hasCustomCacheTtl =
        typeof user?.customCacheTtl === 'number' && user.customCacheTtl > 0;

    return {
        role,
        roleLabel: roleConfig.label,
        rateLimit: hasCustomRateLimit ? user!.customRateLimit! : roleConfig.rateLimit,
        heavyLimit: roleConfig.heavyLimit,
        cacheTtl: hasCustomCacheTtl ? user!.customCacheTtl! : roleConfig.commandCacheTtl,
        hasCustomRateLimit,
        hasCustomCacheTtl
    };
}
