import { useMemo, type ReactNode } from 'react';
import {
    overlayAppearanceStyle,
    parseOverlayAppearance
} from '@/features/overlay/lib/overlayAppearance';

export function OverlayAppearanceRoot({ children }: { children: ReactNode }) {
    const appearance = useMemo(
        () => parseOverlayAppearance(typeof window !== 'undefined' ? window.location.search : ''),
        []
    );

    return <div style={overlayAppearanceStyle(appearance)}>{children}</div>;
}
