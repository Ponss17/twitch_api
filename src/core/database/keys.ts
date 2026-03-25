// Claves de colecciones principales (Hashes)
export const USERS_KEY = 'twitch_users';
export const API_KEYS_KEY = 'twitch_api_keys';
export const GLOBAL_STATS_KEY = 'twitch_stats_all';
export const ADMINS_KEY = 'twitch_admins';

// Claves de logs y auditoría (Lists)
export const LOGS_KEY = 'twitch_system_logs';
export const AUDIT_LOGS_KEY = 'twitch_audit_logs';

// Prefijos de claves dinámicas
export const STATS_CNT_PREFIX = 'twitch_stats_cnt:';
export const USER_ACTIVITY_PREFIX = 'activity:';
export const ACTIVITY_LIST_PREFIX = 'activity_v2:';

// Límites de almacenamiento
export const MAX_LOGS = 200;
export const MAX_AUDIT_LOGS = 500;
export const MAX_USER_LOGS = 50;
