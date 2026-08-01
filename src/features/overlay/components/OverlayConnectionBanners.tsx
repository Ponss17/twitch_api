import { OverlayStatusBanner } from '@/features/overlay/components/OverlayStatusBanner';
import { useTranslation } from '@/core/i18n/I18nContext';

interface OverlayConnectionBannersProps {
    connected: boolean;
    stale: boolean;
}

export function OverlayConnectionBanners({ connected, stale }: OverlayConnectionBannersProps) {
    const { t } = useTranslation();
    const bT = t.overlay.banners;
    return (
        <>
            {!connected && <OverlayStatusBanner message={bT.connecting} />}
            {connected && stale && (
                <OverlayStatusBanner message={bT.waiting} />
            )}
        </>
    );
}
