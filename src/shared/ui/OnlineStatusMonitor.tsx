import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/ui/ToastProvider';

export function OnlineStatusMonitor() {
    const { showToast } = useToast();
    const wasOfflineRef = useRef(!navigator.onLine);

    useEffect(() => {
        const onOffline = () => {
            showToast('Sin conexión a internet. Modo offline activado.', 'info');
            wasOfflineRef.current = true;
        };

        const onOnline = () => {
            if (wasOfflineRef.current) {
                showToast('Conexión restaurada', 'success');
            }
            wasOfflineRef.current = false;
        };

        window.addEventListener('offline', onOffline);
        window.addEventListener('online', onOnline);

        return () => {
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('online', onOnline);
        };
    }, [showToast]);

    return null;
}
