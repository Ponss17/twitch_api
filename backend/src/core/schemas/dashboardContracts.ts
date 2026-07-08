/**
 * Contratos JSON del panel (FE ↔ BE). Solo tipos — importar con `import type`.
 * Alias FE: `@contracts/*` → `backend/src/core/schemas/*`.
 */

export type ActivityLogType =
    | 'clip'
    | 'followage'
    | 'shoutout'
    | 'message'
    | 'russian'
    | 'magic8'
    | 'duel'
    | 'stalker'
    | 'trends'
    | 'roulette'
    | 'other';

/** Entrada para escribir activity_logs. */
export interface ActivityLogEntry {
    type: ActivityLogType;
    user: string;
    metadata?: Record<string, unknown>;
}

/** Fila de activity que ve el panel / Realtime. */
export interface DashboardActivityLog {
    timestamp: string;
    type: string;
    user: string;
    metadata?: Record<string, unknown>;
}

/**
 * Perfil embebido en `/dashboard/summary` y `/dashboard/user-info`.
 * `timezone` / `cacheTtl` los enriquece el controller tras Helix.
 */
export interface DashboardProfile {
    id: string;
    login: string;
    display_name: string;
    broadcaster_type?: string;
    description?: string;
    profile_image_url?: string;
    created_at?: string;
    view_count?: number;
    followers: number;
    views?: number;
    role?: string;
    roleLabel?: string;
    rateLimit?: number;
    cacheTtl?: number;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
    timezone?: string;
}
