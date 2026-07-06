import { CACHE_TTL } from './cacheTtl';


export const USER_ROLES = {
    default: { label: 'Default', rateLimit: 30, cacheMultiplier: 1.0 },
    pro: { label: 'Pro', rateLimit: 60, cacheMultiplier: 0.75 },
    vip: { label: 'VIP', rateLimit: 90, cacheMultiplier: 0.5 },
    partner: { label: 'Partner', rateLimit: 120, cacheMultiplier: 0.25 }
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
    cacheMultiplier: number;
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

/** Prioridad: personalizado → fallbackTtl * roleMultiplier. */
export function resolveUserCacheTtl(
    user?: UserLimitsSource | null,
    fallbackTtl: number = CACHE_TTL.COMMAND
): number {
    const custom = user?.customCacheTtl;
    if (typeof custom === 'number' && custom > 0) return custom;
    const multiplier = getRoleConfig(user?.role).cacheMultiplier;
    return Math.max(1, Math.round(fallbackTtl * multiplier));
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
        cacheMultiplier: roleConfig.cacheMultiplier,
        hasCustomRateLimit,
        hasCustomCacheTtl
    };
}

/** Default mostrado en perfil cuando no hay override ni rol especial. */
export const DEFAULT_USER_CACHE_TTL = 60;
