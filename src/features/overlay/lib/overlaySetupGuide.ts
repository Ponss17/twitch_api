import type { OverlayTool } from '@/features/overlay/lib/types';
import type { Translations } from '@/core/i18n/locales/es';

export type OverlayPlatform = 'obs' | 'streamlabs';

export const OVERLAY_SETUP_VERSION = 'beta 1.4';

/** Muestra la URL sin token ni credenciales en query. */
export function maskOverlayUrlForDisplay(url: string): string {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        parsed.searchParams.delete('overlayToken');
        parsed.searchParams.delete('apiKey');
        parsed.searchParams.delete('auth');
        const query = parsed.searchParams.toString();
        return query
            ? `${parsed.origin}${parsed.pathname}?${query}`
            : `${parsed.origin}${parsed.pathname}`;
    } catch {
        return url.replace(/([?&])(overlayToken|apiKey|auth)=[^&]*/gi, '$1$2=••••');
    }
}

export interface OverlayGuideStep {
    title: string;
    detail: string;
}

export interface OverlayPlatformGuide {
    title: string;
    steps: OverlayGuideStep[];
    note: string;
}

export function getOverlayPlatformGuide(
    tool: OverlayTool,
    platform: OverlayPlatform,
    gT: Translations['overlay']['guide']
): OverlayPlatformGuide {
    const size = gT.sizes[tool];

    if (platform === 'obs') {
        return {
            title: gT.obsTitle,
            steps: [
                { title: gT.obsSteps.sourceTitle, detail: gT.obsSteps.sourceDetail },
                { title: gT.obsSteps.urlTitle, detail: gT.obsSteps.urlDetail },
                { title: gT.obsSteps.sizeTitle, detail: gT.obsSteps.sizeDetail(size) },
                {
                    title: gT.obsSteps.refreshTitle,
                    detail: gT.obsSteps.refreshDetail
                }
            ],
            note: gT.obsNote
        };
    }

    return {
        title: gT.slTitle,
        steps: [
            { title: gT.slSteps.sourceTitle, detail: gT.slSteps.sourceDetail },
            { title: gT.slSteps.urlTitle, detail: gT.slSteps.urlDetail },
            { title: gT.slSteps.sizeTitle, detail: gT.slSteps.sizeDetail(size) },
            {
                title: gT.slSteps.refreshTitle,
                detail: gT.slSteps.refreshDetail
            }
        ],
        note: gT.slNote
    };
}
