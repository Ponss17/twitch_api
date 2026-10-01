import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { legalPath, staticPath } from '@/core/config/paths';
import { useTranslation } from '@/core/i18n/I18nContext';
import { landingBtnSecondary, PRODUCT_TABS } from '../lib/landingContent';
import { LandingAuthCta } from '../sections/LandingAuthCta';

const NOTCH_RADIUS = 16;

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

    const railRef = useRef<HTMLDivElement>(null);
    const tabRef = useRef<HTMLDivElement>(null);
    const tabListRef = useRef<HTMLDivElement>(null);
    const tabBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [notch, setNotch] = useState({ rail: 0, tabW: 0, tabH: 0 });
    const [activePill, setActivePill] = useState<{
        top: number;
        left: number;
        width: number;
        height: number;
    } | null>(null);
    const [smoothPill, setSmoothPill] = useState(false);

    useLayoutEffect(() => {
        const rail = railRef.current;
        const tabEl = tabRef.current;
        if (!rail || !tabEl) return;

        const measure = () => {
            setNotch({
                rail: rail.clientWidth,
                tabW: tabEl.offsetWidth,
                tabH: tabEl.offsetHeight
            });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(rail);
        ro.observe(tabEl);
        return () => ro.disconnect();
    }, []);

    useLayoutEffect(() => {
        const list = tabListRef.current;
        if (!list) return;

        const measurePill = () => {
            const btn = tabBtnRefs.current[index];
            if (!btn) return;
            setActivePill({
                top: btn.offsetTop,
                left: btn.offsetLeft,
                width: btn.offsetWidth,
                height: btn.offsetHeight
            });
        };

        measurePill();
        const id = window.requestAnimationFrame(() => setSmoothPill(true));
        const ro = new ResizeObserver(measurePill);
        ro.observe(list);
        return () => {
            window.cancelAnimationFrame(id);
            ro.disconnect();
        };
    }, [index]);

    useEffect(() => {
        if (paused || total < 2) return;
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % PRODUCT_TABS.length);
        }, 6000);
        return () => window.clearInterval(id);
    }, [paused, total]);

    const r = NOTCH_RADIUS;
    const { rail, tabW, tabH } = notch;
    const left = Math.max(r, (rail - tabW) / 2);
    const right = Math.min(rail - r, left + tabW);
    const y = 0.5;
    const notchPath =
        rail > 0 && tabW > 0 && tabH > 0
            ? [
                  `M 0 ${y}`,
                  `H ${left - r}`,
                  `A ${r} ${r} 0 0 1 ${left} ${y + r}`,
                  `V ${tabH - r}`,
                  `A ${r} ${r} 0 0 0 ${left + r} ${tabH}`,
                  `H ${right - r}`,
                  `A ${r} ${r} 0 0 0 ${right} ${tabH - r}`,
                  `V ${y + r}`,
                  `A ${r} ${r} 0 0 1 ${right + r} ${y}`,
                  `H ${rail}`
              ].join(' ')
            : '';

    return (
        <section
            id="producto"
            className="relative scroll-mt-24 overflow-x-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative bg-bg-main">
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

            <div className="relative bg-bg-main">
                <div ref={railRef} className="relative w-full">
                    {notchPath ? (
                        <svg
                            aria-hidden
                            className="pointer-events-none absolute top-0 left-0"
                            width={rail}
                            height={tabH + 1}
                        >
                            <path
                                d={notchPath}
                                fill="none"
                                stroke="var(--border-strong)"
                                strokeWidth="1"
                            />
                        </svg>
                    ) : null}
                    <div className="relative flex justify-center">
                        <div ref={tabRef} className="px-1 pb-1.5">
                            <div
                                ref={tabListRef}
                                className="relative flex w-max max-w-full flex-wrap justify-center gap-1"
                                role="tablist"
                                aria-label={hT.tablistAria}
                            >
                                {activePill ? (
                                    <span
                                        aria-hidden
                                        className={`pointer-events-none absolute z-0 rounded-full bg-primary/15 motion-reduce:transition-none ${
                                            smoothPill
                                                ? 'transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
                                                : ''
                                        }`}
                                        style={{
                                            top: activePill.top,
                                            left: activePill.left,
                                            width: activePill.width,
                                            height: activePill.height
                                        }}
                                    />
                                ) : null}
                                {PRODUCT_TABS.map((item, i) => {
                                    const active = i === index;
                                    const label = hT.tabs[item.id].label;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            ref={(el) => {
                                                tabBtnRefs.current[i] = el;
                                            }}
                                            onClick={() => setIndex(i)}
                                            className={`relative z-[1] rounded-full px-3.5 py-2 text-[0.8125rem] font-medium transition-colors sm:px-4 sm:text-sm ${
                                                active
                                                    ? 'text-text-main'
                                                    : 'text-text-muted hover:text-text-main'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {tabMeta ? (
                    <div id="panel" className="relative scroll-mt-24 px-5 pt-10 pb-0 md:px-8 md:pt-12">
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
            </div>
        </section>
    );
}
