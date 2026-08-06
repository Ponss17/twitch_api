/**
 * Tipos base del sistema de temas visuales de LosPerris API.
 */

export const SUPPORTED_THEMES = ['dark', 'light', 'liga', 'minimal', 'matrix'] as const;

export type Theme = (typeof SUPPORTED_THEMES)[number];

export interface ThemeDefinition {
    /** Identificador único del tema */
    id: Theme;
    /** Clave de traducción para el nombre legible en la interfaz */
    nameKey: string;
    /** Color meta para la barra de estado del navegador móvil (`theme-color`) */
    metaColor: string;
    /** Color representativo de acento para previsualizaciones en UI */
    accentColor: string;
    /** Evento personalizado de Easter Egg asociado a este tema (si aplica) */
    easterEggEvent?: string;
    /** Indica si el tema cuenta con un fondo interactivo animado */
    hasBackgroundEffect?: boolean;
}

