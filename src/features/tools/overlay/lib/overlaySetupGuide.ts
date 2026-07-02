import type { OverlayTool } from '@/features/tools/overlay/lib/types';

export type OverlayPlatform = 'obs' | 'streamlabs';

const TOOL_LABELS: Record<OverlayTool, string> = {
    trends: 'Tendencias',
    roulette: 'Ruleta'
};

const SIZE_HINTS: Record<OverlayTool, string> = {
    trends: '900 × 420 px (barra superior) o el ancho de tu escena',
    roulette: '720 × 720 px centrado en la escena'
};

export function overlayToolLabel(tool: OverlayTool): string {
    return TOOL_LABELS[tool];
}

export interface OverlayPlatformGuide {
    title: string;
    steps: string[];
    tips: string[];
}

export function getOverlayPlatformGuide(
    tool: OverlayTool,
    platform: OverlayPlatform
): OverlayPlatformGuide {
    const size = SIZE_HINTS[tool];
    const toolLabel = TOOL_LABELS[tool];

    if (platform === 'obs') {
        return {
            title: 'Mejor configuración en OBS',
            steps: [
                'Fuentes → añade **Navegador** (Browser Source).',
                `Pega la URL del overlay de ${toolLabel}.`,
                `Tamaño recomendado: **${size}**.`,
                'Marca **Actualizar navegador cuando la escena se active**.',
                'No añadas color de fondo: el overlay ya es transparente.'
            ],
            tips: [
                'Controla todo desde el panel; el overlay en OBS solo muestra el estado.',
                'Si no se actualiza, clic derecho en la fuente → **Interactuar** o recarga la escena.',
                'Tras un deploy nuevo, recarga la fuente o añade `&v=1` al final de la URL.'
            ]
        };
    }

    return {
        title: 'Mejor configuración en Streamlabs',
        steps: [
            'Fuentes → **Custom Widget** o **Browser Source**.',
            `Pega la URL del overlay de ${toolLabel}.`,
            `Tamaño recomendado: **${size}**.`,
            'Si tu plan lo permite, activa el refresco al mostrar la escena.',
            'Deja el fondo transparente; no uses overlay de color detrás.'
        ],
        tips: [
            'El panel publica el estado; Streamlabs solo refleja lo que ves en el dashboard.',
            'Si la fuente queda en negro, comprueba que la URL incluye `overlayToken=`.',
            'Genera un enlace nuevo si cambiaste la API key o el token expiró.'
        ]
    };
}
