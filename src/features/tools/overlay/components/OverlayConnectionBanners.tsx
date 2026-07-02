import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';

interface OverlayConnectionBannersProps {
    connected: boolean;
    stale: boolean;
}

export function OverlayConnectionBanners({ connected, stale }: OverlayConnectionBannersProps) {
    return (
        <>
            {!connected && <OverlayStatusBanner message="Conectando overlay…" />}
            {connected && stale && (
                <OverlayStatusBanner message="Esperando datos del panel…" />
            )}
        </>
    );
}
