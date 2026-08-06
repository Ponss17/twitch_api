import { useState, useEffect } from 'react';
import type { Theme } from './theme.types';
import {
    DEFAULT_THEME,
    THEME_STORAGE_KEY,
    THEME_DEFINITIONS,
    THEME_META_COLORS,
    isTheme
} from './theme.config';

export { SUPPORTED_THEMES } from './theme.types';
export type { Theme, ThemeDefinition } from './theme.types';
export { THEME_DEFINITIONS, THEME_META_COLORS, THEME_STORAGE_KEY, DEFAULT_THEME, isTheme } from './theme.config';

export const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && isTheme(stored)) {
            return stored;
        }
    }
    return DEFAULT_THEME;
};

let currentTheme: Theme = getInitialTheme();
let transitionTimeout: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(theme: Theme) => void>();

export function applyDomTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', theme);
    }

    // Sincronizar color de barra del navegador móvil
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', THEME_META_COLORS[theme] ?? '#09090b');
    }
}

export const setTheme = (theme: Theme) => {
    if (!isTheme(theme)) return;
    if (theme === currentTheme) return;

    currentTheme = theme;
    if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        const root = document.documentElement;
        root.classList.add('theme-transition');
        applyDomTheme(theme);

        const easterEgg = THEME_DEFINITIONS[theme]?.easterEggEvent;
        if (easterEgg) {
            window.dispatchEvent(new CustomEvent(easterEgg));
        }

        if (transitionTimeout) clearTimeout(transitionTimeout);
        transitionTimeout = setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 260);
    }
    listeners.forEach((listener) => listener(theme));
};

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>(currentTheme);

    useEffect(() => {
        const handler = (newTheme: Theme) => setThemeState(newTheme);
        listeners.add(handler);

        // Asegurar que el DOM coincide al montar
        applyDomTheme(currentTheme);

        return () => {
            listeners.delete(handler);
        };
    }, []);

    return {
        theme,
        setTheme,
        currentDefinition: THEME_DEFINITIONS[theme]
    };
};
