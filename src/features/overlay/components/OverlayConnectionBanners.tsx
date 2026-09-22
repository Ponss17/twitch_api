import { useTranslation } from '@/core/i18n/I18nContext';
import { OverlayStatusBanner } from '@/features/overlay/components/OverlayStatusBanner';

interface OverlayConnectionBannersProps {
    connected: boolean;
    stale: boolean;
    unauthorized?: boolean;
    retrying?: boolean;
    onRetry?: () => void;
}

export function OverlayConnectionBanners({
    connected,
    stale,
    unauthorized = false,
    retrying = false,
    onRetry
}: OverlayConnectionBannersProps) {
    const { t } = useTranslation();
    const bT = t.overlay.banners;

    if (unauthorized) {
        return (
            <OverlayStatusBanner
                message={bT.unauthorized}
                actionLabel={onRetry ? (retrying ? t.common.retrying : t.common.retry) : undefined}
                onAction={onRetry && !retrying ? onRetry : undefined}
            />
        );
    }

    if (!connected) {
        return (
            <OverlayStatusBanner
                message={bT.connecting}
                actionLabel={onRetry ? (retrying ? t.common.retrying : t.common.retry) : undefined}
                onAction={onRetry && !retrying ? onRetry : undefined}
            />
        );
    }

    if (stale) {
        return (
            <OverlayStatusBanner
                message={bT.waiting}
                actionLabel={onRetry ? (retrying ? t.common.retrying : t.common.retry) : undefined}
                onAction={onRetry && !retrying ? onRetry : undefined}
            />
        );
    }

    return null;
}
