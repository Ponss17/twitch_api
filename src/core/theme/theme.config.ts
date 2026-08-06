import { SUPPORTED_THEMES, type Theme, type ThemeDefinition } from './theme.types';

export const THEME_STORAGE_KEY = 'los_perris_theme';

export const DEFAULT_THEME: Theme = 'dark';

export const THEME_DEFINITIONS: Record<Theme, ThemeDefinition> = {
    dark: {
        id: 'dark',
        nameKey: 'dark',
        metaColor: '#09090b',
        accentColor: '#9146ff'
    },
    light: {
        id: 'light',
        nameKey: 'light',
        metaColor: '#f8fafc',
        accentColor: '#7c3aed'
    },
    liga: {
        id: 'liga',
        nameKey: 'liga',
        metaColor: '#0b0c10',
        accentColor: '#ef4444',
        easterEggEvent: 'app:trigger-liga-easter-egg'
    },
    minimal: {
        id: 'minimal',
        nameKey: 'minimal',
        metaColor: '#000000',
        accentColor: '#ffffff'
    },
    matrix: {
        id: 'matrix',
        nameKey: 'matrix',
        metaColor: '#050a06',
        accentColor: '#00ff66',
        easterEggEvent: 'app:trigger-matrix-easter-egg',
        hasBackgroundEffect: true
    }
};

/** Mapeo directo de Theme a su color meta (theme-color) */
export const THEME_META_COLORS: Record<Theme, string> = Object.entries(THEME_DEFINITIONS).reduce(
    (acc, [key, def]) => {
        acc[key as Theme] = def.metaColor;
        return acc;
    },
    {} as Record<Theme, string>
);

/** Validador de tipo para temas soportados */
export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (SUPPORTED_THEMES as readonly string[]).includes(value);
}
