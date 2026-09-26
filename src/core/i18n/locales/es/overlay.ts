/** Fragmento i18n: overlay (es). */
export const overlay = {
overlay: {
        button: {
            title: 'Abrir guía del overlay',
            aria: 'Configurar overlay',
            label: 'Overlay'
        },
        setupModal: {
            titlePrefix: 'Overlay —',
            description: 'Sigue las instrucciones para conectar el overlay a tu software de streaming.',
            warning: 'La URL lleva tu token secreto.',
            warningBold: 'No la compartas públicamente.',
            generating: 'Generando enlace…',
            copying: 'Copiando…',
            copied: '¡Copiado al Portapapeles!',
            copySrc: 'Copiar URL de la Fuente',
            generateError: 'No se pudo generar la URL del overlay',
            copySuccess: 'URL del overlay copiada',
            copyError: 'No se pudo copiar la URL'
        },
        guide: {
            obsTitle: 'Configurar en OBS',
            obsSteps: {
                sourceTitle: 'Nueva fuente',
                sourceDetail: 'Fuentes → Navegador (Browser Source).',
                urlTitle: 'Pegar URL',
                urlDetail:
                    'Copia la URL del botón de abajo (incluye color y tamaño elegidos) y pégala en OBS.',
                sizeTitle: 'Ancho y alto',
                sizeDetail: (size: string): string =>
                    `Pon exactamente ${size}, fondo transparente. Si cambias Pequeño/Normal/Grande arriba, usa estas medidas nuevas.`,
                refreshTitle: 'Al activar escena',
                refreshDetail:
                    'Marca «Actualizar navegador cuando la escena se active». Si se queda en blanco al volver, prueba «Apagar fuente cuando no sea visible».'
            },
            obsNote:
                'Elige color y tamaño arriba antes de copiar la URL. El overlay solo muestra; para iniciar, girar o reiniciar usa el panel.',
            slTitle: 'Configurar en Streamlabs',
            slSteps: {
                sourceTitle: 'Nueva fuente',
                sourceDetail: 'Fuentes → Custom Widget o Browser Source.',
                urlTitle: 'Pegar URL',
                urlDetail:
                    'Copia la URL del botón de abajo (incluye color y tamaño elegidos) y pégala en Streamlabs.',
                sizeTitle: 'Ancho y alto',
                sizeDetail: (size: string): string =>
                    `Pon exactamente ${size}, sin color de fondo. Si cambias Pequeño/Normal/Grande arriba, usa estas medidas nuevas.`,
                refreshTitle: 'Al mostrar escena',
                refreshDetail: 'Activa el refresco automático si tu plan lo permite.'
            },
            slNote:
                'Elige color y tamaño arriba antes de copiar la URL. Si la fuente se ve negra, revisa medidas, fondo transparente y refresco al mostrar la escena.',
            tools: {
                trends: 'Tendencias',
                roulette: 'Ruleta',
                questions: 'Preguntas',
                'bits-roulette': 'Ruleta Bits'
            },
            sizes: {
                trends: (w: number, h: number): string =>
                    `${w} × ${h} px (top 10; ancho de escena si prefieres)`,
                roulette: (w: number, h: number): string => `${w} × ${h} px`,
                questions: (w: number, h: number): string =>
                    `${w} × ${h} px (pregunta actual; ancho de escena si prefieres)`,
                'bits-roulette': (w: number, h: number): string => `${w} × ${h} px`
            }
        },
        appearance: {
            title: 'Apariencia en directo',
            badge: 'Solo overlay',
            desc: 'Color, tamaño y opciones de la alerta van en la URL. Las medidas de OBS/Streamlabs abajo se actualizan según Pequeño, Normal o Grande.',
            colorLabel: 'Color',
            customColor: 'Color personalizado',
            preset: 'Preset',
            scaleLabel: 'Tamaño',
            scaleSm: 'Pequeño',
            scaleMd: 'Normal',
            scaleLg: 'Grande'
        },
        questions: {
            now: 'Pregunta actual',
            waitingTitle: 'Escuchando',
            waitingHint: 'Los viewers preguntan con !{keyword}',
            queue: '{count} en cola'
        },
        banners: {
            connecting: 'Conectando overlay…',
            waiting: 'Esperando datos del panel…',
            unauthorized: 'Enlace de overlay inválido o caducado. Genera uno nuevo en el panel.'
        },
        gate: {
            invalidLink: 'Enlace de overlay inválido. Genera uno nuevo desde el panel.'
        },
        apps: {
            rouletteErrorTitle: 'Overlay de ruleta',
            bitsRouletteErrorTitle: 'Overlay de ruleta por bits',
            trendsErrorTitle: 'Overlay de tendencias',
            questionsErrorTitle: 'Overlay de preguntas'
        }
    }
};
