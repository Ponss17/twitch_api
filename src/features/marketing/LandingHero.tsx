import { useEffect, useState } from 'react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { appPath, legalPath, staticPath } from '@/core/config/paths';
import { landingBtnPrimary, landingBtnSecondary, PRODUCT_TABS } from './landingContent';
import { ArrowRightIcon } from './landingIcons';

type LandingHeroProps = {
    hasSession: boolean;
    legacyReloginNotice: boolean;
    onLoginClick: () => void;
};

export function LandingHero({ hasSession, legacyReloginNotice, onLoginClick }: LandingHeroProps) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = PRODUCT_TABS.length;
    const tab = PRODUCT_TABS[index] ?? PRODUCT_TABS[0];

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
                        Comandos para tu
                        <br />
                        Stream.
                    </h1>
                    <p className="mx-auto mt-5 max-w-[34rem] text-base leading-relaxed text-text-muted md:text-lg">
                        {legacyReloginNotice
                            ? 'Tu sesión anterior ya no es válida. Vuelve a conectar con Twitch.'
                            : 'Comandos, overlays y minijuegos. Pégalo en Nightbot, StreamElements, Streamlabs u OBS.'}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        {hasSession ? (
                            <a href={appPath('/dashboard/')} className={landingBtnPrimary}>
                                Ir al Panel
                                <ArrowRightIcon className="h-4 w-4" />
                            </a>
                        ) : (
                            <button type="button" onClick={onLoginClick} className={landingBtnPrimary}>
                                <TwitchIcon className="h-4 w-4" />
                                {legacyReloginNotice ? 'Volver a conectar con Twitch' : 'Empezar'}
                            </button>
                        )}
                        <a href="#panel" className={landingBtnSecondary}>
                            Ver el panel
                        </a>
                    </div>
                    {!hasSession ? (
                        <p className="mx-auto mt-4 max-w-sm text-[0.75rem] leading-relaxed text-text-muted">
                            Al conectar aceptas la{' '}
                            <a
                                href={legalPath('privacidad')}
                                className="underline underline-offset-2 transition hover:text-text-main"
                            >
                                política de privacidad
                            </a>{' '}
                            y los{' '}
                            <a
                                href={legalPath('terminos')}
                                className="underline underline-offset-2 transition hover:text-text-main"
                            >
                                términos de uso
                            </a>
                            .
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="relative border-t border-border-strong px-5">
                <div
                    className="absolute top-0 left-1/2 z-[1] flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-wrap justify-center gap-0.5 rounded-lg border border-border-subtle bg-bg-secondary p-1"
                    role="tablist"
                    aria-label="El panel"
                >
                    {PRODUCT_TABS.map((item, i) => {
                        const active = i === index;
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
                                        : 'text-text-muted hover:bg-bg-hover-neutral hover:text-text-main'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {tab ? (
                <div id="panel" className="relative scroll-mt-24 px-5 pt-12 pb-0 md:px-8 md:pt-14">
                    <p
                        key={tab.id}
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
                                key={tab.id}
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
                                    alt={item.label}
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
