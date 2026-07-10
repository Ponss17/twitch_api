import { Book, ArrowLeft, Heart } from 'lucide-react';
import { DiscordIcon, InstagramIcon } from '@/shared/ui/icons/BrandIcons';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { appPath, dashboardHomePath, docsReturnPath, saveDocsReturnPath, staticPath } from '@/core/config/paths';
import { aboutFadeIn } from '@/core/utils/tw';
import { AboutTechCards } from '@/features/about/AboutTechCards';

const NARRATIVE_CARD =
    'relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01] p-8 transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.03] backdrop-blur-sm group';

function animDelay(delay: number): CSSProperties {
    return { animationDelay: `${delay * 0.12}s` };
}

function AboutHeader() {
    return (
        <header className="fixed top-0 left-0 z-[1000] w-full border-b border-white/5 bg-bg-main/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1550px] items-center justify-between px-4 py-3.5 max-md:flex-col max-md:gap-3 md:px-16">
                <div className="flex items-center gap-3">
                    <img
                        src={staticPath('/img/logo.svg')}
                        alt="Logo"
                        className="h-9 w-9 object-contain md:h-12 md:w-12"
                        draggable={false}
                    />
                    <h1 className="m-0 text-xl font-extrabold tracking-tight text-white md:text-[1.4rem]">
                        LosPerris <span className="text-primary">Twitch Api</span>
                    </h1>
                </div>
                <nav className="flex gap-4">
                    <a
                        href={appPath('/docs')}
                        onClick={saveDocsReturnPath}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-white"
                    >
                        <Book className="size-5 shrink-0" aria-hidden />
                        Documentación
                    </a>
                    <a
                        href="https://discord.gg/8uN3qY5E"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-white"
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
        label: '01 / MÍ',
        title: 'Hola, soy Ponss.',
        text: 'Estudiante de ingeniería informática apasionado por la tecnología, pero no me percibo como un "programador". Solo soy alguien que intenta ayudar con lo que hago.',
        delay: 2,
        colSpan: 'col-span-1 md:col-span-2'
    },
    {
        label: '02 / EL PORQUÉ',
        title: 'Para la comunidad.',
        text: 'Esto es un proyecto hobby hecho para la comunidad, porque cuesta conseguir estas herramientas. Siempre será gratis.',
        delay: 3,
        colSpan: 'col-span-1'
    },
    {
        label: '03 / EQUIPO',
        title: 'Con mis amigos.',
        text: 'Hago todo con 2 amigos (aunque yo escribo el código). También uso IA para que todo salga mucho más eficiente.',
        delay: 4,
        colSpan: 'col-span-1 md:col-span-3'
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
            {/* Background Glow */}
            <div className="pointer-events-none absolute top-[-10%] left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
            
            <AboutHeader />

            <main className="relative z-[2] mx-auto w-full max-w-[1000px] px-5 pt-28 pb-[80px] md:pt-[160px]">
                <a
                    href={returnPath}
                    className={`mb-[40px] inline-flex items-center gap-2.5 py-2 text-[0.85rem] font-bold tracking-[0.1em] text-[#71717a] uppercase no-underline transition hover:text-white ${aboutFadeIn}`}
                    style={animDelay(0.5)}
                >
                    <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-1" aria-hidden="true" />
                    Volver
                </a>

                {/* Hero Profile Card */}
                <header
                    className={`mb-[20px] relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-10 max-md:p-6 shadow-2xl ${aboutFadeIn}`}
                    style={animDelay(1)}
                >
                    <div className="pointer-events-none absolute top-0 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[80px]" />
                    <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-8">
                        <div>
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[0.75rem] font-bold tracking-[0.1em] text-primary uppercase backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                Desarrollador Principal
                            </span>
                            <div className="mb-3 flex items-center gap-4">
                                <h1 className="m-0 text-[3rem] font-extrabold leading-none tracking-[-0.04em] md:text-[4rem]">Ponss</h1>
                            </div>
                            <div className="flex items-center gap-3 text-[0.9rem] text-[#c4c4cc] font-medium">
                                <span>22 años</span>
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                <img src="https://flagcdn.com/cr.svg" alt="CR" className="h-3.5 w-auto rounded-[2px]" />
                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                <span>Estudiante de Informática</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 md:items-end w-full md:w-auto">
                            <button
                                type="button"
                                className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-[0.95rem] font-medium text-white transition hover:-translate-y-1 hover:border-[#5865f2]/50 hover:bg-[#5865f2]/10 hover:shadow-[0_0_20px_rgba(88,101,242,0.2)]"
                                onClick={() => void copyDiscord()}
                            >
                                <DiscordIcon className="w-5 h-5 text-[#5865f2] transition group-hover:scale-110" aria-hidden="true" />
                                <span>ponsschiquito</span>
                            </button>
                            <a
                                href="https://www.instagram.com/ponss_jean/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-[0.95rem] font-medium text-white no-underline transition hover:-translate-y-1 hover:border-[#e4405f]/50 hover:bg-[#e4405f]/10 hover:shadow-[0_0_20px_rgba(228,64,95,0.2)]"
                            >
                                <InstagramIcon className="w-5 h-5 text-[#e4405f] transition group-hover:scale-110" aria-hidden="true" />
                                <span>ponss_jean</span>
                            </a>
                        </div>
                    </div>
                </header>

                {/* Bento Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    {NARRATIVE_BLOCKS.map((block) => (
                        <div
                            key={block.label}
                            className={`${NARRATIVE_CARD} ${block.colSpan} ${aboutFadeIn}`}
                            style={animDelay(block.delay)}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <span className="mb-4 block text-[0.7rem] font-bold tracking-[0.2em] text-primary uppercase">
                                {block.label}
                            </span>
                            <h2 className="mb-3 text-[1.6rem] font-bold tracking-tight text-white leading-tight">
                                {block.title}
                            </h2>
                            <p className="m-0 text-[0.95rem] leading-relaxed text-[#a1a1aa] font-medium">{block.text}</p>
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-1 gap-5 mb-5">
                    <div className={`${NARRATIVE_CARD} ${aboutFadeIn}`} style={animDelay(5)}>
                        <div className="flex flex-col items-center text-center mb-10">
                            <span className="mb-3 block text-[0.7rem] font-bold tracking-[0.2em] text-primary uppercase">
                                04 / Tecnologías
                            </span>
                            <h2 className="text-[2rem] font-bold tracking-tight text-white leading-tight mb-3">
                                Nuestro Stack
                            </h2>
                            <p className="text-[0.95rem] leading-relaxed text-[#a1a1aa] font-medium max-w-[500px]">
                                Todo lo que hace funcionar esta API por detrás. Un stack moderno y eficiente.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-black/40 p-6 md:p-10 shadow-inner">
                            <AboutTechCards />
                        </div>
                    </div>
                </section>

                <section className={`grid grid-cols-1 ${aboutFadeIn}`} style={animDelay(6)}>
                    <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-10 md:p-16 text-center backdrop-blur-sm">
                        <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
                        <Heart className="mx-auto mb-6 h-12 w-12 text-primary animate-pulse" />
                        <h2 className="mb-4 text-[2.2rem] font-extrabold tracking-tight text-white md:text-[3rem] leading-none">
                            ¿Tienes ideas?
                        </h2>
                        <p className="mx-auto mb-8 max-w-[600px] text-lg leading-relaxed text-[#c4c4cc] font-medium">
                            Espero que disfrutes la API y te ayude en tus streams. Búscame en Discord para colaborar, proponer ideas o reportar errores.
                        </p>
                        <a
                            href="https://discord.gg/8uN3qY5E"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[1.05rem] font-bold text-black transition hover:scale-105 hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            <DiscordIcon className="w-6 h-6 text-[#5865f2]" aria-hidden="true" /> 
                            Únete al Discord
                        </a>
                    </div>
                </section>
            </main>

            <div
                className={`pointer-events-none fixed right-[30px] bottom-[30px] z-[2000] rounded-full bg-white px-6 py-3 text-[0.9rem] font-extrabold text-black transition-all duration-300 shadow-xl ${
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
