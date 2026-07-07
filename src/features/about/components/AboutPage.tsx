import { Book, ArrowLeft } from 'lucide-react';
import { DiscordIcon, InstagramIcon } from '@/shared/ui/icons/BrandIcons';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { appPath, dashboardHomePath, docsReturnPath, saveDocsReturnPath, staticPath } from '@/core/config/paths';
import { aboutFadeIn } from '@/core/ui/tw';
import { AboutTechCards } from '@/features/about/components/AboutTechCards';

const NARRATIVE_CARD =
    'rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary/[0.04]';

function animDelay(delay: number): CSSProperties {
    return { animationDelay: `${delay * 0.12}s` };
}

function AboutHeader() {
    return (
        <header className="fixed top-0 left-0 z-[1000] w-full border-b border-white/5 bg-bg-main">
            <div className="mx-auto flex max-w-[1550px] items-center justify-between px-4 py-3.5 max-md:flex-col max-md:gap-3 md:px-16">
                <div className="flex items-center gap-3">
                    <img
                        src={staticPath('/img/logo.svg')}
                        alt="Logo"
                        className="h-9 w-9 object-contain md:h-16 md:w-16"
                        draggable={false}
                    />
                    <h1 className="m-0 text-xl font-extrabold tracking-tight text-white md:text-[1.6rem]">
                        LosPerris <span className="text-primary">Twitch Api</span>
                    </h1>
                </div>
                <nav className="flex gap-4">
                    <a
                        href={appPath('/docs')}
                        onClick={saveDocsReturnPath}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-white"
                    >
                        <Book className="size-5 shrink-0" aria-hidden />
                        Documentación
                    </a>
                    <a
                        href="https://discord.gg/8uN3qY5E"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-white"
                    >
                        <DiscordIcon className="size-5 shrink-0" aria-hidden="true" />
                        Comunidad
                    </a>
                </nav>
            </div>
        </header>
    );
}

const NARRATIVE_BLOCKS = [
    {
        label: '01 / UN POQUITO DE MÍ',
        title: 'Hola, soy Ponss.',
        text: 'Soy un estudiante de ingeniería informática apasionado por la tecnología, pero no me percibo como un "programador". Solo soy alguien que intenta ayudar con lo que hago.',
        delay: 2
    },
    {
        label: '02 / EL PORQUÉ DE ESTO',
        title: 'Para ayudar a la comunidad.',
        text: 'Esto es un proyecto hobby hecho para la comunidad de Twitch, ya que vi que cuesta conseguir herramientas así. Está pensado para que siempre sea gratis y seguiré añadiendo más cosas poco a poco.',
        delay: 3
    },
    {
        label: '03 / QUIÉNES SOMOS',
        title: 'Trabajo con mis amigos.',
        text: 'Hago todo con mis 2 amigos, aunque yo soy el principal porque tengo más entendimiento del código. También uso IA para que todo salga mas eficiente.',
        delay: 4
    }
] as const;

export function AboutPage() {
    const [returnPath, setReturnPath] = useState(() => dashboardHomePath());
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimerRef = useRef<number | null>(null);

    useEffect(() => {
        setReturnPath(docsReturnPath());
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current !== null) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const copyDiscord = async () => {
        try {
            await navigator.clipboard.writeText('ponsschiquito');
            setToastVisible(true);
            if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 3000);
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="relative flex flex-1 flex-col overflow-x-hidden bg-bg-main font-[Outfit,Inter,system-ui,sans-serif] text-sm text-white">
            <AboutHeader />

            <main className="relative z-[2] mx-auto max-w-[900px] px-5 pt-20 pb-[60px] md:pt-[140px]">
                <a
                    href={returnPath}
                    className={`mb-[30px] inline-flex items-center gap-2.5 py-2 text-[0.85rem] font-bold tracking-[0.1em] text-[#c4c4cc] uppercase no-underline transition hover:text-primary ${aboutFadeIn}`}
                    style={animDelay(0.5)}
                >
                    <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" aria-hidden="true" />
                    Volver al Panel
                </a>

                <header
                    className={`mb-[60px] flex items-end justify-between border-b border-white/5 pb-10 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-10 ${aboutFadeIn}`}
                    style={animDelay(1)}
                >
                    <div>
                        <div className="mb-2 flex items-center gap-4">
                            <h1 className="m-0 text-[2rem] font-extrabold tracking-[-0.05em] md:text-5xl">Ponss</h1>
                            <span className="inline-flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-1 text-[0.8rem] font-semibold text-[#c4c4cc]">
                                22 años{' '}
                                <img src="https://flagcdn.com/cr.svg" alt="CR" className="h-auto w-[18px] rounded-sm" />
                            </span>
                        </div>
                        <span className="block text-[0.75rem] font-bold tracking-[0.2em] text-primary uppercase">
                            Estudiante de informática :)
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-[18px] py-2.5 text-[0.9rem] text-[#c4c4cc] transition hover:-translate-y-0.5 hover:border-[#5865f2] hover:bg-[#5865f2]/10 hover:text-white"
                            onClick={() => void copyDiscord()}
                        >
                            <DiscordIcon className="w-5 h-5" aria-hidden="true" />
                            <span>Ponss</span>
                        </button>
                        <a
                            href="https://www.instagram.com/ponss_jean/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-[18px] py-2.5 text-[0.9rem] text-[#c4c4cc] no-underline transition hover:-translate-y-0.5 hover:border-[#e4405f] hover:bg-[#e4405f]/10 hover:text-white"
                        >
                            <InstagramIcon className="w-5 h-5" aria-hidden="true" />
                            <span>ponss_jean</span>
                        </a>
                    </div>
                </header>

                <section>
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-10">
                        {NARRATIVE_BLOCKS.map((block) => (
                            <div
                                key={block.label}
                                className={`${NARRATIVE_CARD} ${aboutFadeIn}`}
                                style={animDelay(block.delay)}
                            >
                                <span className="mb-3 block text-[0.65rem] font-extrabold tracking-[0.15em] text-[#c4c4cc] uppercase">
                                    {block.label}
                                </span>
                                <h2 className="mb-4 text-[1.5rem] font-bold tracking-[-0.02em] text-white md:text-[1.8rem]">
                                    {block.title}
                                </h2>
                                <p className="m-0 text-base leading-[1.7] text-[#c4c4cc]">{block.text}</p>
                            </div>
                        ))}

                        <div className={`col-span-1 md:col-span-2 ${NARRATIVE_CARD} ${aboutFadeIn}`} style={animDelay(5)}>
                            <span className="mb-3 block text-[0.65rem] font-extrabold tracking-[0.15em] text-[#c4c4cc] uppercase">
                                04 / Técnologías
                            </span>
                            <h2 className="mb-4 text-[1.5rem] font-bold tracking-[-0.02em] text-white md:text-[1.8rem]">
                                Lo que uso para el proyecto.
                            </h2>
                            <p className="mb-6 text-base leading-[1.7] text-[#c4c4cc]">
                                Un enfoque técnico para los que se pregunten como funciona:
                            </p>
                            <AboutTechCards />
                        </div>

                        <div className={`col-span-1 md:col-span-2 ${NARRATIVE_CARD} ${aboutFadeIn}`} style={animDelay(6)}>
                            <div className="flex items-center justify-between gap-10 max-md:flex-col max-md:items-start max-md:gap-6">
                                <div>
                                    <span className="mb-3 block text-[0.65rem] font-extrabold tracking-[0.15em] text-[#c4c4cc] uppercase">
                                        05 / FEEDBACK
                                    </span>
                                    <h2 className="mb-4 text-[1.5rem] font-bold tracking-[-0.02em] text-white md:text-[1.8rem]">
                                        ¿Tienes dudas o alguna idea?
                                    </h2>
                                    <p className="m-0 text-base leading-[1.7] text-[#c4c4cc]">
                                        Espero que la disfruten y les ayude en sus streams. Búscame en Discord para
                                        colaborar o reportar errores.
                                    </p>
                                </div>
                                <a
                                    href="https://discord.gg/8uN3qY5E"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center gap-3 rounded-xl border-2 border-[#5865f2] bg-transparent px-7 py-3.5 text-base font-extrabold whitespace-nowrap text-[#5865f2] no-underline transition hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#5865f2] hover:text-white"
                                >
                                    <DiscordIcon className="w-[1em] h-[1em]" aria-hidden="true" /> Discord
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <div
                className={`pointer-events-none fixed right-[30px] bottom-[30px] z-[2000] rounded-full bg-white px-6 py-3 text-[0.9rem] font-extrabold text-black transition-all duration-300 ${
                    toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                }`}
                role="status"
                aria-live="polite"
            >
                Copiado: ponsschiquito
            </div>
        </div>
    );
}
