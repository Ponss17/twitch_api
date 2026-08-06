import {
    SUPPORTED_THEMES,
    DEFAULT_THEME,
    THEME_STORAGE_KEY,
    THEME_DEFINITIONS,
    THEME_META_COLORS,
    isTheme,
    getThemeInitScript,
    getInitialTheme,
    setTheme,
    applyDomTheme
} from '@/core/theme';

describe('Theme Core Architecture', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    test('isTheme valida correctamente los temas soportados', () => {
        expect(isTheme('dark')).toBe(true);
        expect(isTheme('light')).toBe(true);
        expect(isTheme('liga')).toBe(true);
        expect(isTheme('minimal')).toBe(true);
        expect(isTheme('matrix')).toBe(true);

        expect(isTheme('invalid_theme')).toBe(false);
        expect(isTheme(123)).toBe(false);
        expect(isTheme(null)).toBe(false);
        expect(isTheme(undefined)).toBe(false);
    });

    test('SUPPORTED_THEMES contiene los 5 temas visuales requeridos', () => {
        expect(SUPPORTED_THEMES).toEqual(['dark', 'light', 'liga', 'minimal', 'matrix']);
    });

    test('THEME_DEFINITIONS tiene metadatos completos para cada tema', () => {
        SUPPORTED_THEMES.forEach((theme) => {
            const def = THEME_DEFINITIONS[theme];
            expect(def).toBeDefined();
            expect(def.id).toBe(theme);
            expect(def.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(def.metaColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        expect(THEME_DEFINITIONS.liga.easterEggEvent).toBe('app:trigger-liga-easter-egg');
        expect(THEME_DEFINITIONS.matrix.easterEggEvent).toBe('app:trigger-matrix-easter-egg');
        expect(THEME_DEFINITIONS.matrix.hasBackgroundEffect).toBe(true);

        expect(THEME_META_COLORS.dark).toBe(THEME_DEFINITIONS.dark.metaColor);
        expect(THEME_META_COLORS.matrix).toBe(THEME_DEFINITIONS.matrix.metaColor);
    });

    test('getThemeInitScript genera script inline válido y seguro para <head>', () => {
        const script = getThemeInitScript();
        expect(script).toContain(THEME_STORAGE_KEY);
        expect(script).toContain(DEFAULT_THEME);
        expect(script).toContain('data-theme');
        expect(script).toContain('theme-color');
    });

    test('getInitialTheme lee de localStorage o retorna DEFAULT_THEME', () => {
        expect(getInitialTheme()).toBe('dark');

        localStorage.setItem(THEME_STORAGE_KEY, 'matrix');
        expect(getInitialTheme()).toBe('matrix');

        localStorage.setItem(THEME_STORAGE_KEY, 'corrupted');
        expect(getInitialTheme()).toBe('dark');
    });

    test('applyDomTheme asigna o remueve data-theme adecuadamente', () => {
        applyDomTheme('matrix');
        expect(document.documentElement.getAttribute('data-theme')).toBe('matrix');

        applyDomTheme('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    test('setTheme actualiza almacenamiento y dispara eventos de Easter Egg', () => {
        const matrixListener = jest.fn();
        window.addEventListener('app:trigger-matrix-easter-egg', matrixListener);

        setTheme('matrix');

        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('matrix');
        expect(matrixListener).toHaveBeenCalledTimes(1);

        window.removeEventListener('app:trigger-matrix-easter-egg', matrixListener);
    });
});
