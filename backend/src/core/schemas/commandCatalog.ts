/**
 * Catálogo único de comandos / actividad (BE + contratos FE vía `@contracts/commandCatalog`).
 * Al añadir un comando de bot o herramienta trackeada: actualizar aquí primero.
 */

/** Segmentos de path que identifican respuestas de bot (texto plano, no JSON API). */
export const BOT_PATH_MARKERS = [
    '/followage',
    '/watchtime',
    '/shoutout',
    '/create-clip',
    '/send-message',
    '/magic8',
    '/russian',
    '/duel',
    '/slots'
] as const;

/**
 * Activity types que alimentan el leaderboard de viewers
 * (quien dispara el comando, no tools de panel).
 */
export const VIEWER_ACTIVITY_TYPES = [
    'followage',
    'watchtime',
    'clip',
    'shoutout',
    'magic8',
    'russian',
    'duel',
    'slots'
] as const;

/** Tools del panel que reportan uso vía POST /dashboard/track-usage. */
export const TOOL_USAGE_TYPES = ['trends', 'stalker', 'roulette'] as const;

/**
 * Todos los `activity_logs.type` reconocidos (incluye tools, message y other).
 * Orden estable para UI / filtros.
 */
export const ACTIVITY_LOG_TYPES = [
    'clip',
    'followage',
    'watchtime',
    'shoutout',
    'message',
    'russian',
    'magic8',
    'duel',
    'slots',
    'stalker',
    'trends',
    'roulette',
    'other'
] as const;

export type BotPathMarker = (typeof BOT_PATH_MARKERS)[number];
export type ViewerActivityType = (typeof VIEWER_ACTIVITY_TYPES)[number];
export type ToolUsageType = (typeof TOOL_USAGE_TYPES)[number];
export type ActivityLogType = (typeof ACTIVITY_LOG_TYPES)[number];

/** Tuple no vacío para `z.enum(...)`. */
export const TOOL_USAGE_ENUM = TOOL_USAGE_TYPES as unknown as [
    ToolUsageType,
    ...ToolUsageType[]
];

export function isBotCommandPath(path: string): boolean {
    return BOT_PATH_MARKERS.some((marker) => path.includes(marker));
}

export function isViewerActivityType(type: string): type is ViewerActivityType {
    return (VIEWER_ACTIVITY_TYPES as readonly string[]).includes(type);
}

export function isToolUsageType(type: string): type is ToolUsageType {
    return (TOOL_USAGE_TYPES as readonly string[]).includes(type);
}

export function isActivityLogType(type: string): type is ActivityLogType {
    return (ACTIVITY_LOG_TYPES as readonly string[]).includes(type);
}
