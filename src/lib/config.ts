export const API_BASE = '/api/twitch';

export const API_ENDPOINTS = {
    BASE: API_BASE,
    MAGIC8: `${API_BASE}/minigames/magic8`,
    ANALYTICS: `${API_BASE}/dashboard/analytics`,
    REGENERATE_KEY: `${API_BASE}/system/regenerate-key`,
    FEEDBACK: `${API_BASE}/system/feedback`,
    CHATTERS: `${API_BASE}/dashboard/chatters`,
    USER_INFO: `${API_BASE}/dashboard/user-info`,
    SUMMARY: `${API_BASE}/dashboard/summary`,
    SEND_MESSAGE: `${API_BASE}/send-message`,
    CLIPS: `${API_BASE}/dashboard/get-clips`,
    ACTIVITY: `${API_BASE}/dashboard/activity`,
    CLEAR_DATA: `${API_BASE}/dashboard/clear-data`,
    DELETE_ACCOUNT: `${API_BASE}/dashboard/delete-account`,
    TIMEZONE: `${API_BASE}/dashboard/timezone`,
    /** Ping ligero (sin DB/KV/Twitch) — usar para polling del dashboard. */
    LIGHT_HEALTH: `${API_BASE}/health`,
    /** Diagnóstico completo — solo manual / admin, no polling. */
    HEALTH: `${API_BASE}/system/health`,
    VALIDATE: `${API_BASE}/system/validate`,
    REALTIME_TOKEN: `${API_BASE}/system/realtime-token`,
    DUEL: `${API_BASE}/minigames/duel`,
    AUTH_LOGIN: `${API_BASE}/auth/twitch`
} as const;

/** Debe coincidir con twitch_api/frontend/features/dashboard/dashboard-config.ts */
export const IGNORED_BOTS = new Set([
    'nightbot',
    'streamelements',
    'fossabot',
    'moobot',
    'wizebot',
    'soundalert',
    'rainmaker',
    'botrixoficial',
    'trackerggbot',
    'streamlabs',
    'cloudbot',
    'deepbot',
    'phantombot',
    'streamerbot',
    'stayhydratedbot',
    'commanderroot',
    'own3d',
    'streamholics',
    'anotherttvviewer',
    'electricallongboard'
]);

/** Mismas variables que el backend (.env), inyectadas en build por astro.config.mjs */
export const SUPABASE_URL = import.meta.env.SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY ?? '';

export type DashboardTab =
    | 'home'
    | 'followage'
    | 'clips'
    | 'shoutout'
    | 'trends'
    | 'stalker'
    | 'magic8'
    | 'roulette'
    | 'russian'
    | 'duel'
    | 'profile'
    | 'feedback';

export interface Session {
    token?: string;
    apiKey?: string;
    displayName?: string;
    login?: string;
    profile_image_url?: string;
    userId?: string;
    isNewLogin?: boolean;
}

export interface ApiResponse<T = unknown> {
    valid?: boolean;
    /** true cuando no se pudo verificar la sesión por un fallo transitorio (red/5xx). */
    offline?: boolean;
    error?: string | boolean;
    message?: string;
    data?: T;
    [key: string]: unknown;
}
