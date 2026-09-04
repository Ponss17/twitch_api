import { card } from '@/core/utils/tw';
import { subtleIcon } from '@/features/dashboard/lib/ui/subtleAccents';
import { useTranslation } from '@/core/i18n/I18nContext';
import { FEATURE_STEPS, PANEL_ITEMS } from '../lib/landingContent';
import { DicesIcon, TrendingUpIcon, UserRoundCheckIcon } from '../lib/landingIcons';
import { LandingVisual } from '../sections/LandingVisuals';
import { LandingReveal, LandingRevealItem, LandingRevealList } from '../sections/LandingReveal';
import { LandingFloatIcons } from '../sections/LandingMotif';

const PANEL_ICONS = {
    commands: UserRoundCheckIcon,
    tools: TrendingUpIcon,
    minigames: DicesIcon
} as const;

export function LandingFeatures() {
    const { t } = useTranslation();
    const fT = t.landing.features;

    return (
        <>
            <section id="features" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
                <LandingFloatIcons layout="a" side="left" />
                <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[640px] text-center md:mb-14">
                    <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                        {fT.stepsTitle}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">{fT.stepsSubtitle}</p>
                </LandingReveal>
                <LandingRevealList className="relative z-[1] mx-auto grid max-w-[1080px] gap-4 md:grid-cols-3">
                    {FEATURE_STEPS.map((step) => {
                        const copy = fT.steps[step.visual];
                        return (
                            <LandingRevealItem
                                key={step.n}
                                className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary"
                            >
                                <LandingVisual id={step.visual} fill />
                                <div className="border-t border-border-subtle px-5 py-5 md:px-6 md:py-6">
                                    <p className="mb-3 font-mono text-[0.75rem] font-semibold text-primary">{step.n}</p>
                                    <h3 className="text-lg font-semibold text-text-main">{copy.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{copy.text}</p>
                                </div>
                            </LandingRevealItem>
                        );
                    })}
                </LandingRevealList>
            </section>

            <section id="incluye" className="relative scroll-mt-24 px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
                <LandingFloatIcons layout="b" side="right" />
                <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[640px] text-center md:mb-14">
                    <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                        {fT.panelTitle}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">{fT.panelSubtitle}</p>
                </LandingReveal>
                <LandingRevealList className="relative z-[1] mx-auto grid max-w-[1080px] gap-4 md:grid-cols-3">
                    {PANEL_ITEMS.map((item) => {
                        const Icon = PANEL_ICONS[item.id];
                        const copy = fT.panels[item.id];
                        return (
                            <LandingRevealItem key={item.id} className={`${card} flex flex-col p-6 md:p-7`}>
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                                >
                                    <Icon className="h-4 w-4" aria-hidden />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-text-main">{copy.title}</h3>
                                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{copy.text}</p>
                                <ul className="mt-4 flex flex-wrap gap-1">
                                    {copy.items.map((chip) => (
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
