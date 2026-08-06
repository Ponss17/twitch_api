import { useState, useEffect } from 'react';
import { MatrixEasterEggTrigger } from './matrix/MatrixEasterEggTrigger';

/**
 * Contenedor unificado de Easter Eggs para el Dashboard.
 * 100% Client-Side. Aislado del SSR de Vercel.
 */
export function ThemeEasterEggs() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // El servidor renderiza nada. Vercel no sabe de esto.
    if (!isClient) return null;

    return (
        <>
            {/* Lista de Easter Eggs. Cada uno maneja su propia carga perezosa y eventos. */}
            <MatrixEasterEggTrigger />
            {/* <FuturoEasterEggTrigger /> */}
        </>
    );
}
