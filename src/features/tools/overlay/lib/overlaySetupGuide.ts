import type { OverlayTool } from '@/features/tools/overlay/lib/types';

export type OverlayPlatform = 'obs' | 'streamlabs';

const TOOL_LABELS: Record<OverlayTool, string> = {
    trends: 'Tendencias',
    roulette: 'Ruleta'
};

const SIZE_HINTS: Record<OverlayTool, string> = {
    trends: '900 × 580 px (top 10; ancho de escena si prefieres)',
    roulette: '720 × 720 px'
};

export const OVERLAY_SETUP_VERSION = 'beta 1.2';

export function overlayToolLabel(tool: OverlayTool): string {
    return TOOL_LABELS[tool];
}

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
    platform: OverlayPlatform
): OverlayPlatformGuide {
    const size = SIZE_HINTS[tool];

    if (platform === 'obs') {
        return {
            title: 'Configurar en OBS',
            steps: [
                { title: 'Nueva fuente', detail: 'Fuentes → Navegador (Browser Source).' },
                { title: 'Pegar URL', detail: 'Pega la URL que copiaste en el panel (botón Overlay).' },
                { title: 'Tamaño', detail: `${size}, fondo transparente.` },
                {
                    title: 'Al activar escena',
                    detail: 'Marca «Actualizar navegador cuando la escena se active».'
                }
            ],
            note: 'Solo muestra en pantalla. Para iniciar, girar o reiniciar, usa el panel.'
        };
    }

    return {
        title: 'Configurar en Streamlabs',
        steps: [
            { title: 'Nueva fuente', detail: 'Fuentes → Custom Widget o Browser Source.' },
            { title: 'Pegar URL', detail: 'Pega la URL que copiaste en el panel (botón Overlay).' },
            { title: 'Tamaño', detail: `${size}, sin color de fondo.` },
            {
                title: 'Al mostrar escena',
                detail: 'Activa el refresco automático si tu plan lo permite.'
            }
        ],
        note: 'Si la fuente se ve negra, revisa el tamaño, el fondo transparente y el refresco al mostrar la escena.'
    };
}
