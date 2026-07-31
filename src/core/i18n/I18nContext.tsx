import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { es, type Locale, type Translations } from '@/core/i18n/locales/es';
import { en } from '@/core/i18n/locales/en';

const LOCALE_STORAGE_KEY = 'losperris_locale';
const SUPPORTED_LOCALES: Locale[] = ['es', 'en'];

function loadLocale(): Locale {
    if (typeof window === 'undefined') return 'es';
    try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
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

const LOCALE_MAP: Record<Locale, Translations> = { es, en };

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
