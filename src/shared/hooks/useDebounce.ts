import { useEffect, useState } from 'react';

/**
 * Retorna un valor con retardo (debounced).
 * Evita ejecuciones o filtrados innecesarios durante la escritura rápida.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debouncedValue;
}
