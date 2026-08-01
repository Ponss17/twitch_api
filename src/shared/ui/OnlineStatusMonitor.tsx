import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/ui/ToastProvider';
import { useTranslation } from '@/core/i18n/I18nContext';

export function OnlineStatusMonitor() {
    const { showToast } = useToast();
    const { t } = useTranslation();
    const wasOfflineRef = useRef(!navigator.onLine);

    useEffect(() => {
        const onOffline = () => {
            showToast(t.globals.toasts.offline, 'info');
            wasOfflineRef.current = true;
        };

        const onOnline = () => {
            if (wasOfflineRef.current) {
                showToast(t.globals.toasts.online, 'success');
            }
            wasOfflineRef.current = false;
        };

        window.addEventListener('offline', onOffline);
        window.addEventListener('online', onOnline);

        return () => {
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('online', onOnline);
        };
    }, [showToast, t]);

    return null;
}
