import { useEffect, useRef } from 'react';
import { animateValue } from '@/lib/animateValue';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    /** Suffix HTML (ej. `%` o `ms <span>...</span>`) */
    suffix?: string;
    className?: string;
}

export function AnimatedNumber({ value, duration = 1500, suffix = '', className }: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const prevRef = useRef<number | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        animateValue(el, prevRef.current, value, duration, suffix);
        prevRef.current = value;
    }, [value, duration, suffix]);

    return (
        <span ref={ref} className={className}>
            {value.toLocaleString('es-ES')}
            {suffix && !suffix.includes('<') ? suffix : null}
        </span>
    );
}
