import { appPath } from '@/core/config/paths';
import { LandingReveal } from './LandingReveal';
import { ArrowRightIcon } from './landingIcons';
import { DISCORD_COMMUNITY_URL } from './landingContent';

export function LandingResources() {
    return (
        <section id="recursos" className="relative px-5 pt-4 pb-20 md:px-8 md:pt-8 md:pb-28 overflow-hidden">
            <LandingReveal className="relative z-[1] mx-auto max-w-[1080px]">
                <div className="grid gap-6 md:grid-cols-2">
                    <a
                        href={appPath('/docs')}
                        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary p-8 transition-colors hover:bg-[#18181b]"
                    >
                        <div>
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-bg-main border border-border-subtle text-text-main">
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
                            <h3 className="text-xl font-bold text-text-main">Documentación Oficial</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
                                Guías paso a paso, variables para comandos y tutoriales detallados para que configures
                                tu panel y tus integraciones en minutos.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-[15px] font-semibold text-text-main">
                            Leer la Docs
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
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-bg-main border border-border-subtle text-text-main">
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
                            <h3 className="text-xl font-bold text-text-main">Comunidad en Discord</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
                                Únete a nuestro servidor. Resuelve tus dudas en tiempo real, sugiere nuevas funciones y
                                conoce a otros creadores como tú.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-[15px] font-semibold text-text-main">
                            Unirse al servidor
                            <ArrowRightIcon className="h-4 w-4" />
                        </div>
                    </a>
                </div>
            </LandingReveal>
        </section>
    );
}
