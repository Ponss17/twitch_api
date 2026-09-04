import { useEffect, useState } from 'react';
import { legalPath, staticPath } from '@/core/config/paths';
import { useTranslation } from '@/core/i18n/I18nContext';
import { landingBtnSecondary, PRODUCT_TABS } from '../lib/landingContent';
import { LandingAuthCta } from '../sections/LandingAuthCta';

type LandingHeroProps = {
    legacyReloginNotice: boolean;
    onLoginClick: () => void;
};

export function LandingHero({ legacyReloginNotice, onLoginClick }: LandingHeroProps) {
    const { t } = useTranslation();
    const hT = t.landing.hero;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = PRODUCT_TABS.length;
    const tabMeta = PRODUCT_TABS[index] ?? PRODUCT_TABS[0];
    const tab = tabMeta ? hT.tabs[tabMeta.id] : hT.tabs.inicio;

    useEffect(() => {
        if (paused || total < 2) return;
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % PRODUCT_TABS.length);
        }, 6000);
        return () => window.clearInterval(id);
    }, [paused, total]);

    return (
        <section
            id="producto"
            className="relative scroll-mt-24 overflow-x-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative">
                <div
                    className="pointer-events-none absolute inset-x-0 top-14 bottom-0 md:top-16"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
                        backgroundSize: '72px 72px',
                        backgroundPosition: 'center top',
                        maskImage: 'radial-gradient(ellipse 70% 80% at 50% 45%, black 25%, transparent 72%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 45%, black 25%, transparent 72%)'
                    }}
                    aria-hidden
                />
                <div className="relative mx-auto max-w-[820px] px-5 pt-28 pb-12 text-center md:px-8 md:pt-40 md:pb-14">
                    <p className="mb-6 inline-flex items-center rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1 text-[0.78rem] font-medium text-text-muted">
                        <a href="https://nightbot.tv/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-text-main">Nightbot</a>
                        <span className="mx-1.5">·</span>
                        <a href="https://streamelements.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-text-main">StreamElements</a>
                        <span className="mx-1.5">·</span>
                        <a href="https://streamlabs.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-text-main">Streamlabs</a>
                    </p>
                    <h1 className="text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-text-main sm:text-5xl md:text-[3.5rem] md:leading-[1.05]">
                        {hT.headlineLine1}
                        <br />
                        {hT.headlineLine2}
                    </h1>
                    <p className="mx-auto mt-5 max-w-[34rem] text-base leading-relaxed text-text-muted md:text-lg">
                        {legacyReloginNotice ? hT.legacyNotice : hT.subtitle}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <LandingAuthCta
                            variant="hero"
                            legacyReloginNotice={legacyReloginNotice}
                            onLoginClick={onLoginClick}
                        />
                        <a href="#panel" className={landingBtnSecondary}>
                            {hT.seePanel}
                        </a>
                    </div>
                    <p
                        data-lp-auth-disclaimer
                        className="mx-auto mt-4 max-w-sm text-[0.75rem] leading-relaxed text-text-muted"
                    >
                        {hT.disclaimerBefore}{' '}
                        <a
                            href={legalPath('privacidad')}
                            className="underline underline-offset-2 transition hover:text-text-main"
                        >
                            {hT.privacy}
                        </a>{' '}
                        {hT.disclaimerAnd}{' '}
                        <a
                            href={legalPath('terminos')}
                            className="underline underline-offset-2 transition hover:text-text-main"
                        >
                            {hT.terms}
                        </a>
                        {hT.disclaimerAfter}
                    </p>
                </div>
            </div>

            <div className="relative border-t border-border-strong px-5">
                <div
                    className="absolute top-0 left-1/2 z-[1] flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-wrap justify-center gap-0.5 rounded-lg border border-border-subtle bg-bg-secondary p-1"
                    role="tablist"
                    aria-label={hT.tablistAria}
                >
                    {PRODUCT_TABS.map((item, i) => {
                        const active = i === index;
                        const label = hT.tabs[item.id].label;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setIndex(i)}
                                className={`rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium transition sm:px-3.5 sm:text-sm ${
                                    active
                                        ? 'bg-primary/15 text-text-main'
                                        : 'text-text-muted hover:bg-white/[0.02] hover:text-text-main'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {tabMeta ? (
                <div id="panel" className="relative scroll-mt-24 px-5 pt-12 pb-0 md:px-8 md:pt-14">
                    <p
                        key={tabMeta.id}
                        className="mx-auto mb-8 max-w-xl text-center text-sm leading-relaxed text-text-muted opacity-0 motion-safe:animate-fade-soft md:text-[0.95rem]"
                    >
                        {tab.text}
                    </p>
                    <div className="mx-auto max-w-[1080px] overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                            <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                            <span
                                key={tabMeta.id}
                                className="ml-2 truncate font-mono text-[0.7rem] text-text-muted opacity-0 motion-safe:animate-fade-soft"
                            >
                                ttv.losperris.dev · {tab.label}
                            </span>
                        </div>
                        <div className="grid">
                            {PRODUCT_TABS.map((item, i) => (
                                <img
                                    key={item.id}
                                    src={staticPath(item.src)}
                                    alt={hT.tabs[item.id].label}
                                    width={1912}
                                    height={918}
                                    fetchPriority={i === 0 ? 'high' : 'low'}
                                    loading="eager"
                                    decoding="async"
                                    aria-hidden={i !== index}
                                    className={`col-start-1 row-start-1 h-auto w-full motion-reduce:transition-none ${
                                        i === index ? 'opacity-100' : 'opacity-0'
                                    } transition-opacity duration-500 ease-in-out`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
