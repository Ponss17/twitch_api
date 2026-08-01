import { useLayoutEffect, useRef } from 'react';
import { animateValue } from '@/core/utils/animateValue';
import { useTranslation } from '@/core/i18n/I18nContext';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    /** Suffix HTML (ej. `%` o `ms <span>...</span>`) */
    suffix?: string;
    className?: string;
    /** Mientras carga: muestra "—" en lugar de 0 */
    isLoading?: boolean;
}

const PLACEHOLDER_CLASS = 'text-white/35';

export function AnimatedNumber({
    value,
    duration = 1500,
    suffix = '',
    className,
    isLoading = false
}: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const prevRef = useRef<number | null>(null);
    const bootstrappedRef = useRef(false);
    const wasLoadingRef = useRef(isLoading);
    const { locale } = useTranslation();

    useLayoutEffect(() => {
        if (isLoading) {
            wasLoadingRef.current = true;
            return;
        }

        const el = ref.current;
        if (!el) return;

        const isFirstReveal = wasLoadingRef.current || !bootstrappedRef.current;
        
        if (isFirstReveal) {
            animateValue(el, value, value, 0, suffix, locale);
        } else {
            const start = prevRef.current ?? 0;
            animateValue(el, start, value, duration, suffix, locale);
        }
        
        prevRef.current = value;
        bootstrappedRef.current = true;
        wasLoadingRef.current = false;
    }, [value, duration, suffix, isLoading, locale]);

    if (isLoading) {
        return <span className={[className, PLACEHOLDER_CLASS].filter(Boolean).join(' ')}>—</span>;
    }

    const plainSuffix = suffix && !suffix.includes('<') ? suffix : '';

    return (
        <span ref={ref} className={className}>
            0{plainSuffix}
        </span>
    );
}