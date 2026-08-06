import { useEffect, useRef } from 'react';

export function useSecretCode(
    code: string[],
    onTrigger: () => void,
    enabled: boolean = true
) {
    const onTriggerRef = useRef(onTrigger);
    
    useEffect(() => {
        onTriggerRef.current = onTrigger;
    }, [onTrigger]);

    const codeString = code.join(',');

    useEffect(() => {
        if (!enabled) return;

        let keyIndex = 0;
        const currentCode = codeString.split(',');
        const handleTrigger = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            if (key === currentCode[keyIndex]) {
                keyIndex++;
                if (keyIndex === currentCode.length) {
                    onTriggerRef.current();
                    keyIndex = 0;
                }
            } else {
                keyIndex = key === currentCode[0] ? 1 : 0;
            }
        };

        window.addEventListener('keydown', handleTrigger);
        return () => window.removeEventListener('keydown', handleTrigger);
    }, [enabled, codeString]);
}
