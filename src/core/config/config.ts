const API_BASE = '/api';

export const API_ENDPOINTS = {
    BASE: API_BASE,
    MAGIC8: `${API_BASE}/minigames/magic8/`,
    ANALYTICS: `${API_BASE}/dashboard/analytics/`,
    REGENERATE_KEY: `${API_BASE}/system/regenerate-key/`,
    FEEDBACK: `${API_BASE}/system/feedback/`,
    CHATTERS: `${API_BASE}/dashboard/chatters/`,
    USER_INFO: `${API_BASE}/dashboard/user-info/`,
    SUMMARY: `${API_BASE}/dashboard/summary/`,
    SETTINGS: `${API_BASE}/dashboard/settings/`,
    SEND_MESSAGE: `${API_BASE}/send-message/`,
    CLIPS: `${API_BASE}/dashboard/get-clips/`,
    ACTIVITY: `${API_BASE}/dashboard/activity/`,
    CLEAR_DATA: `${API_BASE}/dashboard/clear-data/`,
    DELETE_ACCOUNT: `${API_BASE}/dashboard/delete-account/`,

    VALIDATE: `${API_BASE}/system/validate/`,
    REALTIME_TOKEN: `${API_BASE}/system/realtime-token/`,
    DUEL: `${API_BASE}/minigames/duel/`,
    AUTH_LOGIN: `${API_BASE}/auth/twitch/`,
    AUTH_EXCHANGE: `${API_BASE}/auth/exchange/`,
    AUTH_LOGOUT: `${API_BASE}/auth/logout/`,
    AUTH_DISCORD_LINK: `${API_BASE}/auth/discord/`,
    AUTH_DISCORD_UNLINK: `${API_BASE}/auth/discord/unlink/`,
    OVERLAY_EXCHANGE: `${API_BASE}/auth/overlay-exchange/`,
    EXPORT_CHECK: `${API_BASE}/dashboard/export-check/`,
    EXPORT_COMPLETE: `${API_BASE}/dashboard/export-complete/`,
    REVEAL_API_KEY: `${API_BASE}/dashboard/reveal-api-key/`
} as const;

/** Página pública de estado (Better Stack). */
export const STATUS_PAGE_URL = 'https://status.losperris.dev';

/** Bots ignorados en métricas de chat (stalker, trends, etc.). */
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
    | 'analytics'
    | 'followage'
    | 'clips'
    | 'shoutout'
    | 'trends'
    | 'stalker'
    | 'magic8'
    | 'roulette'
    | 'russian'
    | 'duel'
    | 'settings'
    | 'feedback';

export interface Session {
    token?: string;
    apiKey?: string;
    overlayToken?: string;
    displayName?: string;
    login?: string;
    profile_image_url?: string;
    userId?: string;
    isNewLogin?: boolean;
    /** Timestamp (ms) en que expira el OAuth token de Twitch. Viene del backend via /validate. */
    tokenExpiresAt?: number;
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
