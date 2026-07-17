import { Book, ArrowLeft, User, Code2, Users } from 'lucide-react';
import { DiscordIcon, InstagramIcon } from '@/shared/ui/icons/BrandIcons';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { appPath, dashboardHomePath, docsReturnPath, saveDocsReturnPath, staticPath } from '@/core/config/paths';
import { aboutFadeIn } from '@/core/utils/tw';
import { AboutTechCards } from '@/features/about/AboutTechCards';

function animDelay(delay: number): CSSProperties {
    return { animationDelay: `${delay * 0.1}s` };
}

function AboutHeader() {
    return (
        <header className="fixed top-0 left-0 z-[1000] w-full border-b border-white/5 bg-bg-main">
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
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-white"
                    >
                        <Book className="size-5 shrink-0" aria-hidden />
                        Documentación
                    </a>
                    <a
                        href="https://discord.gg/PJbExZe7Tp"
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
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-bg-main font-[Outfit,Inter,system-ui,sans-serif] text-sm text-white">
            <AboutHeader />

            <main className="relative z-[2] mx-auto w-full max-w-[1200px] px-6 pt-28 pb-[100px] md:pt-[140px]">

                {/* Hero Section */}
                <section className="relative mb-16 md:mb-24">
                    <a
                        href={returnPath}
                        className={`group mb-8 inline-flex items-center gap-2.5 text-[0.85rem] font-bold tracking-[0.1em] text-[#71717a] uppercase no-underline transition hover:text-white ${aboutFadeIn}`}
                        style={animDelay(0.5)}
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                        Volver al panel
                    </a>

                    <div className={`max-w-[700px] ${aboutFadeIn}`} style={animDelay(1)}>
                        <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Sobre LosPerris API
                        </h1>
                        <p className="mb-10 text-lg text-[#a1a1aa] leading-relaxed md:text-xl md:leading-relaxed">
                            Desarrollo, propósito y las tecnologías detrás de la plataforma. Una API de alto rendimiento creada por y para la comunidad de Twitch.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                className="group flex cursor-pointer items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/[0.05]"
                                onClick={() => void copyDiscord()}
                            >
                                <DiscordIcon className="h-4 w-4 text-[#5865f2] transition-transform group-hover:scale-110" aria-hidden="true" />
                                Discord: ponsschiquito
                            </button>
                            <a
                                href="https://www.instagram.com/ponss_jean/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/[0.05] no-underline"
                            >
                                <InstagramIcon className="h-4 w-4 text-[#e4405f] transition-transform group-hover:scale-110" aria-hidden="true" />
                                Instagram: ponss_jean
                            </a>
                        </div>
                    </div>
                </section>

                {/* Module 1: El Proyecto */}
                <section className="mb-20">
                    <div className={`mb-6 flex items-center gap-3 ${aboutFadeIn}`} style={animDelay(2)}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/[0.03]">
                            <Book className="h-4 w-4 text-[#a1a1aa]" />
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-white">
                            El Proyecto
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className={`group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.03] ${aboutFadeIn}`} style={animDelay(2)}>
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.7rem] font-medium text-[#a1a1aa]">
                                    <span aria-hidden="true" className="text-[0.85rem]">🇨🇷</span> 22 años
                                </div>
                            </div>
                            <span className="mb-1 text-[0.7rem] font-bold tracking-widest text-[#71717a] uppercase">01 / Un poquito de mí</span>
                            <h3 className="mb-2 text-lg font-medium text-white">Hola, soy Ponss.</h3>
                            <p className="text-[0.95rem] leading-relaxed text-[#a1a1aa]">
                                Soy un estudiante de ingeniería informática apasionado por la tecnología, pero no me percibo como un "programador". Solo soy alguien que intenta ayudar con lo que hago.
                            </p>
                        </div>

                        <div className={`group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.03] ${aboutFadeIn}`} style={animDelay(3)}>
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                                <Code2 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="mb-1 text-[0.7rem] font-bold tracking-widest text-[#71717a] uppercase">02 / El porqué de esto</span>
                            <h3 className="mb-2 text-lg font-medium text-white">Para ayudar a la comunidad.</h3>
                            <p className="text-[0.95rem] leading-relaxed text-[#a1a1aa]">
                                Esto es un proyecto hobby hecho para la comunidad de Twitch, ya que vi que cuesta conseguir herramientas así. Está pensado para que siempre sea gratis y seguiré añadiendo más cosas poco a poco.
                            </p>
                        </div>

                        <div className={`group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.03] ${aboutFadeIn}`} style={animDelay(4)}>
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span className="mb-1 text-[0.7rem] font-bold tracking-widest text-[#71717a] uppercase">03 / Quiénes somos</span>
                            <h3 className="mb-2 text-lg font-medium text-white">Trabajo con mis amigos.</h3>
                            <p className="text-[0.95rem] leading-relaxed text-[#a1a1aa]">
                                Hago todo con mis 2 amigos, aunque yo soy el principal porque tengo más entendimiento del código. También uso IA para que todo salga mas eficiente.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Module 3: Client Libraries (Tecnologías) */}
                <section className={`border-t border-primary/20 pt-12 ${aboutFadeIn}`} style={animDelay(8)}>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/[0.03]">
                            <Code2 className="h-4 w-4 text-[#a1a1aa]" />
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-white">
                            Tecnologías Core
                        </h2>
                    </div>
                    <div>
                        <AboutTechCards />
                    </div>
                </section>

                {/* Module 4: Filosofía / Texto Adicional */}
                <section className={`mt-20 border-t border-primary/20 pt-12 ${aboutFadeIn}`} style={animDelay(9)}>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/[0.03]">
                            <Users className="h-4 w-4 text-[#a1a1aa]" />
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-white">
                            Arquitectura del Proyecto
                        </h2>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
                            <div>
                                <h3 className="mb-4 text-2xl font-normal tracking-tight text-white">
                                    Filosofía y Enfoque
                                </h3>
                                <p className="text-[#a1a1aa] leading-relaxed">
                                    La plataforma está diseñada para ser rápida, estable y gratuita. Solo somos un grupo pequeño usando herramientas modernas para asegurar que la API pueda interactuar con Twitch de forma constante y sin problemas las 24 horas del día.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="group border-l-2 border-white/10 pl-6 transition-colors hover:border-primary/50">
                                    <h4 className="mb-2 text-xs font-bold tracking-[0.15em] text-[#71717a] uppercase transition-colors group-hover:text-white">Integración Directa</h4>
                                    <p className="text-[0.95rem] text-[#a1a1aa] leading-relaxed">
                                        Diseñada para conectarse fácilmente con Nightbot, StreamElements o bots propios mediante peticiones simples (urlfetch), brindando mayor interactividad a tu canal de Twitch sin configuraciones complejas.
                                    </p>
                                </div>
                                <div className="group border-l-2 border-white/10 pl-6 transition-colors hover:border-primary/50">
                                    <h4 className="mb-2 text-xs font-bold tracking-[0.15em] text-[#71717a] uppercase transition-colors group-hover:text-white">Crecimiento Orgánico</h4>
                                    <p className="text-[0.95rem] text-[#a1a1aa] leading-relaxed">
                                        Al ser un proyecto para ayudar, siempre estoy abierto a escuchar ideas. Si alguien necesita una función nueva para su chat, me lo puede comentar por Discord o por la seccion de feedback del dashboard e intento agregarlo poco a poco si lo veo conveniente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <div
                className={`pointer-events-none fixed right-[30px] bottom-[30px] z-[2000] rounded-md border border-white/10 bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 ${toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                    }`}
                role="status"
                aria-live="polite"
            >
                Copiado: ponsschiquito
            </div>
        </div>
    );
}
