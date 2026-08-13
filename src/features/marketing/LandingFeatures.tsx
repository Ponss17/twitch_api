import { card } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { FEATURE_STEPS, PANEL_ITEMS } from './landingContent';
import { DicesIcon, TrendingUpIcon, UserRoundCheckIcon } from './landingIcons';
import { LandingVisual } from './LandingVisuals';
import { LandingReveal, LandingRevealItem, LandingRevealList } from './LandingReveal';
import { LandingFloatIcons } from './LandingMotif';

const PANEL_ICONS = {
    Comandos: UserRoundCheckIcon,
    Herramientas: TrendingUpIcon,
    Minijuegos: DicesIcon
} as const;

export function LandingFeatures() {
    return (
        <>
            <section id="features" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
                <LandingFloatIcons layout="a" side="left" />
                <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[640px] text-center md:mb-14">
                    <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                        Empieza con un comando
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">
                        Fácilmente en 3 pasos. Todo desde el navegador.
                    </p>
                </LandingReveal>
                <LandingRevealList className="relative z-[1] mx-auto grid max-w-[1040px] gap-4 md:grid-cols-3">
                    {FEATURE_STEPS.map((step) => (
                        <LandingRevealItem
                            key={step.n}
                            className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary"
                        >
                            <LandingVisual id={step.visual} fill />
                            <div className="border-t border-border-subtle px-5 py-5 md:px-6 md:py-6">
                                <p className="mb-3 font-mono text-[0.75rem] font-semibold text-primary">{step.n}</p>
                                <h3 className="text-lg font-semibold text-text-main">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.text}</p>
                            </div>
                        </LandingRevealItem>
                    ))}
                </LandingRevealList>
            </section>

            <section id="incluye" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
                <LandingFloatIcons layout="b" side="right" />
                <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[640px] text-center md:mb-14">
                    <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                        Todo en un panel
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">
                        Comandos, overlays y minijuegos. Sin otro programa.
                    </p>
                </LandingReveal>
                <LandingRevealList className="relative z-[1] mx-auto grid max-w-[1040px] gap-4 md:grid-cols-3">
                    {PANEL_ITEMS.map((item) => {
                        const Icon = PANEL_ICONS[item.title];
                        return (
                            <LandingRevealItem key={item.title} className={`${card} flex flex-col p-6 md:p-7`}>
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                                >
                                    <Icon className="h-4 w-4" aria-hidden />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-text-main">{item.title}</h3>
                                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{item.text}</p>
                                <ul className="mt-4 flex flex-wrap gap-1">
                                    {item.items.map((chip) => (
                                        <li
                                            key={chip}
                                            className="rounded-md border border-border-subtle bg-bg-main/50 px-1.5 py-0.5 font-mono text-[0.65rem] text-text-muted"
                                        >
                                            {chip}
                                        </li>
                                    ))}
                                </ul>
                            </LandingRevealItem>
                        );
                    })}
                </LandingRevealList>
            </section>
        </>
    );
}
