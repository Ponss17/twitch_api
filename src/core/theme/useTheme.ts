import { useState, useEffect } from 'react';

/** Temas soportados. Añadir aquí para extender el sistema de temas. */
export const SUPPORTED_THEMES = ['dark', 'light', 'liga'] as const;
export type Theme = (typeof SUPPORTED_THEMES)[number];

const THEME_KEY = 'los_perris_theme';

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored && (SUPPORTED_THEMES as ReadonlyArray<string>).includes(stored)) {
            return stored as Theme;
        }
    }
    return 'dark'; // Default
};

let currentTheme = getInitialTheme();
let transitionTimeout: NodeJS.Timeout;
const listeners = new Set<(theme: Theme) => void>();

export const setTheme = (theme: Theme) => {
    currentTheme = theme;
    if (typeof window !== 'undefined') {
        const root = document.documentElement;
        root.classList.add('theme-transition');
        
        localStorage.setItem(THEME_KEY, theme);
        if (theme === 'dark') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', theme);
        }
        
        if (transitionTimeout) clearTimeout(transitionTimeout);
        transitionTimeout = setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 500);

        if (theme === 'liga') {
            window.dispatchEvent(new CustomEvent('app:trigger-liga-easter-egg'));
        }
    }
    listeners.forEach(listener => listener(theme));
};

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>(currentTheme);

    useEffect(() => {
        const handler = (newTheme: Theme) => setThemeState(newTheme);
        listeners.add(handler);
        
        // Ensure DOM matches on mount
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', currentTheme);
        }

        return () => {
            listeners.delete(handler);
        };
    }, []);

    return { theme, setTheme };
};
