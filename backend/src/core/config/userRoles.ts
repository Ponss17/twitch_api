import { CACHE_TTL } from './cacheTtl';


export const USER_ROLES = {
    default: { label: 'Default', rateLimit: 60, cacheTtl: 60 },
    pro: { label: 'Pro', rateLimit: 120, cacheTtl: 120 },
    vip: { label: 'VIP', rateLimit: 300, cacheTtl: 300 },
    partner: { label: 'Partner', rateLimit: 500, cacheTtl: 600 }
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
    cacheTtl: number;
    hasCustomRateLimit: boolean;
    hasCustomCacheTtl: boolean;
}

export function normalizeUserRole(role?: string | null): UserRole {
    if (role && role in USER_ROLES) return role as UserRole;
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

/** Prioridad: personalizado → min(rol, TTL del recurso). */
export function resolveUserCacheTtl(
    user?: UserLimitsSource | null,
    fallbackTtl: number = CACHE_TTL.COMMAND
): number {
    const custom = user?.customCacheTtl;
    if (typeof custom === 'number' && custom > 0) return custom;
    const roleTtl = getRoleConfig(user?.role).cacheTtl;
    return Math.min(roleTtl, fallbackTtl);
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
        cacheTtl: hasCustomCacheTtl ? user!.customCacheTtl! : roleConfig.cacheTtl,
        hasCustomRateLimit,
        hasCustomCacheTtl
    };
}

/** Default mostrado en perfil cuando no hay override ni rol especial. */
export const DEFAULT_USER_CACHE_TTL = USER_ROLES.default.cacheTtl;
