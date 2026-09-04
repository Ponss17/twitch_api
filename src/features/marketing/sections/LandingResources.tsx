import { appPath } from '@/core/config/paths';
import { useTranslation } from '@/core/i18n/I18nContext';
import { LandingReveal } from '../sections/LandingReveal';
import { ArrowRightIcon } from '../lib/landingIcons';
import { DISCORD_COMMUNITY_URL } from '../lib/landingContent';

export function LandingResources() {
    const { t } = useTranslation();
    const r = t.landing.resources;

    return (
        <section id="recursos" className="relative overflow-hidden px-5 pt-4 pb-20 md:px-8 md:pt-8 md:pb-28">
            <LandingReveal className="relative z-[1] mx-auto max-w-[1080px]">
                <div className="grid gap-6 md:grid-cols-2">
                    <a
                        href={appPath('/docs')}
                        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-8 transition-colors hover:bg-[#18181b]"
                    >
                        <div>
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-main text-text-main">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                >
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">{r.docsTitle}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">{r.docsText}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-[15px] font-semibold text-text-main">
                            {r.docsCta}
                            <ArrowRightIcon className="h-4 w-4" />
                        </div>
                    </a>

                    <a
                        href={DISCORD_COMMUNITY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-8 transition-colors hover:bg-[#18181b]"
                    >
                        <div>
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-main text-text-main">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-main">{r.discordTitle}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">{r.discordText}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-[15px] font-semibold text-text-main">
                            {r.discordCta}
                            <ArrowRightIcon className="h-4 w-4" />
                        </div>
                    </a>
                </div>
            </LandingReveal>
        </section>
    );
}
