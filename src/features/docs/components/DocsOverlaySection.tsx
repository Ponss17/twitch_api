import { Layers, Monitor, Radio } from 'lucide-react';
import { appPath } from '@/core/config/paths';
import {
    getOverlayPlatformGuide,
    OVERLAY_SETUP_VERSION,
    overlayToolLabel
} from '@/features/tools/overlay/lib/overlaySetupGuide';
import { OVERLAY_PAGE_PATHS, type OverlayTool } from '@/features/tools/overlay/lib/types';
import {
    docSection,
    docsBadgeBeta,
    docsEndpoint,
    docsInfoCard,
    docsInfoCardPrimary,
    docsInfoCardRed,
    docsMethodGet,
    docsStepCard,
    docsStepsGrid,
    docsUrl
} from '@/core/ui/docsTw';

const OVERLAY_TOOLS: {
    tool: OverlayTool;
    panelPath: string;
    description: string;
}[] = [
    {
        tool: 'trends',
        panelPath: '/dashboard/trends',
        description:
            'Muestra en pantalla el Top 10 de palabras o emotes mientras analizas el chat. Ideal para momentos de hype en stream.'
    },
    {
        tool: 'roulette',
        panelPath: '/dashboard/roulette',
        description:
            'Refleja la ruleta del panel: participantes, giro y ganador. El control (abrir, girar, reset) sigue en el dashboard.'
    }
];

function OverlayPlatformSteps({
    tool,
    platform
}: {
    tool: OverlayTool;
    platform: 'obs' | 'streamlabs';
}) {
    const guide = getOverlayPlatformGuide(tool, platform);
    const Icon = platform === 'obs' ? Monitor : Radio;

    return (
        <div className={docsStepCard}>
            <h4 className="mb-2 flex items-center gap-2 text-[0.9rem] font-bold text-[#fafafa]">
                <Icon className="size-4 text-primary" aria-hidden />
                {guide.title}
            </h4>
            <ol className="m-0 list-none space-y-2 p-0">
                {guide.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-2 text-[0.8125rem] leading-snug text-[#c4c4cc]">
                        <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.65rem] font-bold text-primary"
                            aria-hidden
                        >
                            {index + 1}
                        </span>
                        <span>
                            <strong className="text-[#fafafa]">{step.title}</strong> — {step.detail}
                        </span>
                    </li>
                ))}
            </ol>
            <p className="mb-0 mt-3 border-t border-white/[0.06] pt-2 text-[0.75rem] text-[#71717a]">
                {guide.note}
            </p>
        </div>
    );
}

function OverlayToolBlock({
    tool,
    panelPath,
    description
}: {
    tool: OverlayTool;
    panelPath: string;
    description: string;
}) {
    const label = overlayToolLabel(tool);
    const pagePath = OVERLAY_PAGE_PATHS[tool];

    return (
        <div className="mb-8 scroll-mt-28" id={`overlay-${tool}`}>
            <h3 className="mb-3 text-[1.1rem] font-bold text-[#fafafa]">{label}</h3>
            <p className="mb-4 text-[0.9375rem] text-[#c4c4cc]">{description}</p>

            <div className={docsEndpoint}>
                <span className={docsMethodGet}>URL</span>
                <span className={docsUrl}>
                    {'{baseURL}'}
                    {pagePath}?overlayToken={'{tu_token_overlay}'}
                </span>
            </div>

            <p className="mb-4 text-[0.8125rem] text-[#71717a]">
                Genera el enlace con token desde{' '}
                <a href={appPath(panelPath)} className="font-semibold text-primary no-underline hover:text-primary-hover">
                    {label} en el panel
                </a>{' '}
                → botón <strong className="text-[#fafafa]">Overlay</strong>. No uses la API Key del chat en la URL del
                navegador.
            </p>

            <div className={docsStepsGrid}>
                <OverlayPlatformSteps tool={tool} platform="obs" />
                <OverlayPlatformSteps tool={tool} platform="streamlabs" />
            </div>
        </div>
    );
}

export function DocsOverlaySection() {
    return (
        <section id="overlays" className={docSection} data-doc-section>
            <h2>
                <Layers /> Overlays
                <span className={docsBadgeBeta}>{OVERLAY_SETUP_VERSION}</span>
            </h2>
            <p>
                Fuentes de navegador para OBS o Streamlabs que muestran en pantalla el estado de{' '}
                <strong className="text-[#fafafa]">Tendencias</strong> y{' '}
                <strong className="text-[#fafafa]">Ruleta</strong>. El panel sigue siendo el mando a distancia; el
                overlay solo refleja lo que ocurre ahí.
            </p>

            <div className={docsInfoCardPrimary}>
                <Layers />
                <p>
                    <strong>Función en beta:</strong> la experiencia puede cambiar entre versiones ({OVERLAY_SETUP_VERSION}
                    ). Si algo falla, regenera el enlace desde el botón Overlay del panel.
                </p>
            </div>

            <div className={docsInfoCard}>
                <Monitor />
                <p>
                    <strong>Cómo empezar:</strong> entra al panel con tu cuenta → abre Tendencias o Ruleta → pulsa{' '}
                    <strong>Overlay</strong> → copia la URL → créala como fuente <em>Navegador</em> en tu software de
                    streaming.
                </p>
            </div>

            {OVERLAY_TOOLS.map((item) => (
                <OverlayToolBlock key={item.tool} {...item} />
            ))}

            <div className={docsInfoCardRed}>
                <Radio />
                <p>
                    <strong>Seguridad:</strong> la URL incluye un <code>overlayToken</code> personal. No la publiques en
                    chat, Discord ni captures. Si se filtra, cierra sesión en el panel o regenera el enlace desde el
                    botón Overlay.
                </p>
            </div>
        </section>
    );
}
