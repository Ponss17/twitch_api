import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { es, type Translations } from '@/core/i18n/locales/es';
import { en } from '@/core/i18n/locales/en';
import { pt } from '@/core/i18n/locales/pt';

const LOCALE_STORAGE_KEY = 'losperris_locale';

/** Locales soportados. Añadir aquí para extender el sistema de idiomas. */
export const SUPPORTED_LOCALES = ['es', 'en', 'pt'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const BCP47_MAP: Record<Locale, string> = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
};

export function getBcp47(locale: string = 'es'): string {
    return BCP47_MAP[locale as Locale] || 'es-ES';
}

function loadLocale(): Locale {
    if (typeof window === 'undefined') return 'es';
    try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(stored)) {
            return stored as Locale;
        }
    } catch {
        /* ignore */
    }
    return 'es';
}

function persistLocale(locale: Locale): void {
    try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
        /* ignore */
    }
}

const LOCALE_MAP: Record<Locale, Translations> = { es, en, pt };

interface I18nContextValue {
    locale: Locale;
    t: Translations;
    setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
    locale: 'es',
    t: es,
    setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(loadLocale);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        persistLocale(next);
    }, []);

    // Keep html[lang] in sync for screen readers and SEO
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
        }
    }, [locale]);

    const value = useMemo<I18nContextValue>(
        () => ({ locale, t: LOCALE_MAP[locale], setLocale }),
        [locale, setLocale]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Hook para acceder a las traducciones y al locale activo. */
export function useTranslation(): I18nContextValue {
    return useContext(I18nContext);
}
