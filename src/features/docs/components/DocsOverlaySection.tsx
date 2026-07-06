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
            'Muestra el Top 10 de palabras o emotes en tu stream. Inicias y paras el análisis desde el panel.'
    },
    {
        tool: 'roulette',
        panelPath: '/dashboard/roulette',
        description:
            'Muestra la ruleta en pantalla: participantes, giro y ganador. Abrir, girar y reiniciar se hace en el panel.'
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
                            <strong className="text-[#fafafa]">{step.title}:</strong> {step.detail}
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

            <p className="mb-4 text-[0.8125rem] text-[#c4c4cc]">
                La URL la generas en{' '}
                <a href={appPath(panelPath)} className="font-semibold text-primary no-underline hover:text-primary-hover">
                    {label}
                </a>{' '}
                con el botón <strong className="text-[#fafafa]">Overlay</strong>. No uses tu API Key en la fuente del
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
                Un overlay es una fuente de navegador en OBS o Streamlabs. Muestra en pantalla lo que haces en{' '}
                <strong className="text-[#fafafa]">Tendencias</strong> o <strong className="text-[#fafafa]">Ruleta</strong>
                . No se controla desde OBS: abres, giras y reinicias desde el{' '}
                <a href={appPath('/dashboard')}>panel</a>.
            </p>

            <div className={docsInfoCardPrimary}>
                <Layers />
                <p>
                    <strong>Beta ({OVERLAY_SETUP_VERSION}):</strong> función en desarrollo; puede fallar o cambiar sin
                    aviso.
                </p>
            </div>

            <div className={docsInfoCard}>
                <Monitor />
                <p>
                    <strong>Pasos:</strong> entra al panel, abre Tendencias o Ruleta, pulsa Overlay y copia la URL. En OBS
                    o Streamlabs crea una fuente Navegador y pégala ahí.
                </p>
            </div>

            {OVERLAY_TOOLS.map((item) => (
                <OverlayToolBlock key={item.tool} {...item} />
            ))}

            <div className={docsInfoCardRed}>
                <Radio />
                <p>
                    <strong>Importante:</strong> la URL incluye un <code>overlayToken</code> de solo lectura. No la
                    compartas en chat, Discord ni capturas. No expone tu API Key ni permite controlar el panel. Cada vez
                    que abres Overlay se genera una URL nueva, pero las anteriores siguen siendo válidas.
                </p>
            </div>
        </section>
    );
}
