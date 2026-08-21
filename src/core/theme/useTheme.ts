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

const THEME_TRANSITION_MS = 380;

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

export function applyDomTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', theme);
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', THEME_META_COLORS[theme] ?? '#09090b');
    }
}

function runWithThemeTransition(apply: () => void) {
    if (typeof window === 'undefined') {
        apply();
        return;
    }

    const root = document.documentElement;

    if (prefersReducedMotion()) {
        apply();
        return;
    }

    const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };

    if (typeof doc.startViewTransition === 'function') {
        try {
            const transition = doc.startViewTransition(apply);
            void transition.finished.catch(() => {
                /* ignore abort */
            });
            return;
        } catch {
            /* fallback CSS below */
        }
    }

    root.classList.add('theme-transition');
    apply();
    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        root.classList.remove('theme-transition');
    }, THEME_TRANSITION_MS);
}

export const setTheme = (theme: Theme) => {
    if (!isTheme(theme)) return;
    if (theme === currentTheme) return;

    currentTheme = theme;
    if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        runWithThemeTransition(() => {
            applyDomTheme(theme);
            const easterEgg = THEME_DEFINITIONS[theme]?.easterEggEvent;
            if (easterEgg) {
                window.dispatchEvent(new CustomEvent(easterEgg));
            }
        });
    }
    listeners.forEach((listener) => listener(theme));
};

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>(currentTheme);

    useEffect(() => {
        const handler = (newTheme: Theme) => setThemeState(newTheme);
        listeners.add(handler);

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
