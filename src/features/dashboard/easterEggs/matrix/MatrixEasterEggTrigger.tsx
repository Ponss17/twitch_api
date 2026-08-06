import { useState, lazy, Suspense } from 'react';
import { useTheme } from '@/core/theme/useTheme';
import { useSecretCode } from '@/shared/hooks/useSecretCode';

// Dynamic import: Separa el código en un chunk distinto. 
// Vercel y el SSR ni se enteran de este archivo en la carga inicial.
const MatrixEasterEgg = lazy(() => 
    import('./MatrixEasterEgg').then(module => ({ default: module.MatrixEasterEgg }))
);

const MATRIX_CODE = ['m', 'a', 't', 'r', 'i', 'x'];

export function MatrixEasterEggTrigger() {
    const { theme } = useTheme();
    const [show, setShow] = useState(false);

    useSecretCode(MATRIX_CODE, () => {
        // Easter-egg console message
        /* eslint-disable no-console */
        const s = 'color:#00ff44;font-family:monospace;font-size:16px;background:#000;padding:5px 20px;font-weight:bold;border-left:4px solid #00ff44;display:block;';
        console.log('%cWake up, Neo...', s);
        console.log('%cThe Matrix has you...', s);
        console.log('%cFollow the white rabbit.', s);
        /* eslint-enable no-console */

        // Request fullscreen
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        }

        setShow(true);
    }, theme === 'matrix' && !show);

    return (
        <Suspense fallback={null}>
            {show && <MatrixEasterEgg onClose={() => setShow(false)} />}
        </Suspense>
    );
}
