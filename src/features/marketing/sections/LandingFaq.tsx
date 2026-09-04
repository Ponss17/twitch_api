import { Accordion } from '@/shared/ui/Accordion';
import { useTranslation } from '@/core/i18n/I18nContext';
import { FAQ_ITEMS } from '../lib/landingContent';
import { LandingReveal } from '../sections/LandingReveal';
import { LandingFloatIcons } from '../sections/LandingMotif';

export function LandingFaq() {
    const { t } = useTranslation();
    const faq = t.landing.faq;

    return (
        <section id="faq" className="relative scroll-mt-24 px-5 pt-16 pb-24 md:px-8 md:pt-24 md:pb-32">
            <LandingFloatIcons layout="d" side="right" />
            <LandingReveal className="relative z-[1] mx-auto mb-10 max-w-[640px] text-center md:mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-text-main md:text-[2.25rem] md:leading-tight">
                    {faq.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-text-muted md:text-lg">{faq.subtitle}</p>
            </LandingReveal>
            <LandingReveal className="relative z-[1] mx-auto max-w-[720px]">
                <Accordion
                    items={FAQ_ITEMS.map((item) => {
                        const copy = faq.items[item.id];
                        return {
                            id: item.id,
                            title: copy.title,
                            content: copy.content
                        };
                    })}
                />
            </LandingReveal>
        </section>
    );
}
