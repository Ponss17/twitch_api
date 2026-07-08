import React, { useEffect, useState } from 'react';
import { LoginDisclaimerModal } from '@/shared/ui/LoginDisclaimerModal';
import { VerifyingSessionModal } from '@/shared/ui/VerifyingSessionModal';
import { AppLogo } from '@/shared/ui/AppLogo';
import { resolveSessionFromUrl, markDashboardSplashForFreshLogin, clearDashboardSplashFlags, getSession } from '@/core/api/auth';
import { appPath, legalPath, saveDocsReturnPath } from '@/core/config/paths';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { Accordion } from '@/shared/ui/Accordion';
import { TwitchIcon, DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { UserRoundCheck, Clapperboard, Megaphone, TrendingUp, Binoculars, Dices, Swords, MessageSquare, Book, ArrowRight, Copy, Check } from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON } from '@/features/dashboard/lib/dashboardTabs';

import { SlotText } from 'slot-text/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const GRID_BG = 'bg-[#080808]';

const GRID_STYLE: React.CSSProperties = {
    backgroundImage: `
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px'
};

const GRADIENT_TEXT = 'bg-gradient-to-br from-[#9146ff] to-[#a78bfa] bg-clip-text text-transparent';

const CMD_CODE =
    'rounded border border-[#9146ff]/15 bg-[#9146ff]/10 px-1.5 py-0.5 font-mono text-[0.95em] text-[#a78bfa]';

const FEATURE_CATEGORIES = [
    {
        title: 'Comandos',
        description: 'Interacción directa y automática para dinamizar tu chat.',
        cards: [
            { icon: UserRoundCheck, title: 'Followage', text: 'Muestra cuánto tiempo lleva un usuario siguiendo el canal. ¡Celebra la lealtad!', tag: '!followage' },
            { icon: Clapperboard, title: 'Clips', text: 'Captura los mejores momentos al instante.', tag: '!clip' },
            { icon: Megaphone, title: 'Shoutout', text: 'Promociona a otros streamers con un solo comando.', tag: '!so @user' }
        ]
    },
    {
        title: 'Herramientas',
        description: 'Utilidades prácticas para explorar información y dinamizar tu stream.',
        cards: [
            { icon: TrendingUp, title: 'Tendencias', text: 'Ranking de palabras en tiempo real. Descubre de qué habla tu chat.' },
            { icon: Binoculars, title: 'Stalker', text: 'Investiga perfiles y obtén info pública detallada.' },
            { icon: Dices, title: 'Ruleta', text: 'Juego de azar para sorteos o decisiones rápidas en vivo.' }
        ]
    },
    {
        title: 'Minijuegos',
        description: 'Mantén a tu audiencia entretenida incluso cuando no estás.',
        cards: [
            { icon: MAGIC8_ICON, title: 'Bola 8', text: 'Respuestas aleatorias para las dudas más existenciales de tu chat.', tag: '!8ball' },
            { icon: RUSSIAN_ICON, title: 'Ruleta Rusa', text: 'Prueba tu suerte con un revólver virtual. ¿Sobrevivirás?', tag: '!ruleta' },
            { icon: Swords, title: 'Duelo', text: 'Desafía a otros usuarios a un combate narrativo 1vs1 épico.', tag: '!duelo @user' }
        ]
    },
    {
        title: 'Soporte',
        description: 'Ayuda y documentación para que nunca te quedes atrás.',
        cards: [
            { icon: MessageSquare, title: 'Feedback', text: 'Reporta errores o sugiere nuevas funciones directamente.' },
            { icon: Book, title: 'Documentación', text: 'Guías paso a paso para configurar tu bot en segundos.' },
            { icon: DiscordIcon, title: 'Discord', text: 'Únete a nuestra comunidad para obtener soporte en vivo y compartir ideas.' }
        ]
    }
] as const;

const FAQ_ITEMS = [
    {
        q: '¿Cómo empiezo a usar la API?',
        a: 'Simplemente conecta tu cuenta de Twitch usando el botón de arriba. Una vez autenticado, obtendrás tu API key personal y podrás configurar los comandos desde el dashboard.'
    },
    {
        q: '¿Es gratis?',
        a: 'Sí, la API es completamente gratuita. Todos los comandos y herramientas están disponibles sin costo alguno.'
    },
    {
        q: '¿Necesito un bot para usar los comandos?',
        a: 'Sí, necesitas integrar la API con tu bot de Twitch (como Nightbot, StreamElements, o tu propio bot). La documentación incluye guías para las plataformas más populares.'
    },
    {
        q: '¿Qué comandos están disponibles?',
        a: 'Tenemos comandos de información (followage, clips, shoutout), herramientas de análisis (tendencias, stalker), y minijuegos (bola 8, ruleta). Revisa la sección de arriba para ver todos los detalles.'
    },
    {
        q: '¿Dónde puedo obtener soporte?',
        a: 'Puedes revisar la documentación completa, unirte a nuestro servidor de Discord, o enviar feedback directamente desde el dashboard. Estamos aquí para ayudarte.'
    }
];


export function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [disclaimerOpen, setDisclaimerOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    const copyTerminal = async () => {
        const text = 'curl -G "https://api.losperris.dev/twitch/followage" -d "channel=losperris" -d "user=mynana17" -d "apiKey=sk_a1b2c3d4..."';
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    useEffect(() => {
        setHasSession(!!getSession());
        clearDashboardSplashFlags();

        void (async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionParams = await resolveSessionFromUrl();
            const authParam = params.get('auth');
            const isFreshLogin = !!authParam || sessionParams.isNewLogin === true;

            if (!isFreshLogin) return;

            setIsVerifying(true);
            reportSessionLoadProgress({
                progress: 12,
                label: 'Preparando tu panel…',
                cached: false
            });
            markDashboardSplashForFreshLogin();

            const search = authParam ? `?auth=${encodeURIComponent(authParam)}` : '';
            window.location.href = appPath('/dashboard/') + search;
        })();
    }, []);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false
        });

        const onLenisScroll = ({ scroll }: { scroll: number }) => setScrolled(scroll > 20);
        lenis.on('scroll', onLenisScroll);

        let rafId = 0;
        const raf = (time: number) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        const anchorHandler = (e: Event) => {
            const anchor = e.currentTarget as HTMLAnchorElement;
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            e.preventDefault();
            lenis.scrollTo(href);
        };

        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach((anchor) => anchor.addEventListener('click', anchorHandler));

        return () => {
            cancelAnimationFrame(rafId);
            lenis.off('scroll', onLenisScroll);
            lenis.destroy();
            anchors.forEach((anchor) => anchor.removeEventListener('click', anchorHandler));
        };
    }, []);

    return (
        <div className={`relative flex flex-1 flex-col font-[Outfit,sans-serif] ${GRID_BG}`} style={GRID_STYLE}>
            {/* Gradiente radial para apagar la cuadrícula en los bordes */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,transparent_60%,#080808)]" />
            <header
                className={`fixed inset-x-0 top-0 z-[1000] border-b backdrop-blur-xl transition-colors duration-300 ${
                    scrolled
                        ? 'border-white/10 bg-[#080808]/92'
                        : 'border-white/[0.06] bg-[#080808]/70'
                }`}
            >
                <div className="mx-auto flex max-w-[1550px] flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row md:gap-0 md:px-16 md:py-[0.9rem]">
                    <a href={appPath('/')} className="flex items-center gap-3 text-inherit no-underline">
                        <AppLogo
                            alt="LosPerris"
                            className="h-9 w-9 object-contain md:h-16 md:w-16"
                            draggable={false}
                        />
                        <h1 className="m-0 text-xl font-extrabold tracking-tight md:text-[1.6rem]">
                            LosPerris <span className="text-[#9146ff]">Twitch Api</span>
                        </h1>
                    </a>
                    <nav className="flex w-full justify-center gap-2.5 md:w-auto md:gap-[15px]">
                        <a
                            href={appPath('/docs')}
                            onClick={saveDocsReturnPath}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-[#fafafa]"
                        >
                            <Book className="w-4" /> Documentación
                        </a>
                        <a
                            href="https://discord.gg/8uN3qY5E"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:bg-white/5 hover:text-[#fafafa]"
                        >
                            <DiscordIcon className="w-4" /> Comunidad
                        </a>
                    </nav>
                </div>
            </header>

            <div className="relative z-[1] mx-auto w-full max-w-[1400px] flex-1 px-6 pt-12">
                <section className="grid min-h-0 items-center gap-16 py-24 md:min-h-[88vh] md:grid-cols-2 md:gap-16 md:py-0">
                    <div className="max-w-[600px] text-center md:text-left">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#9146ff]/25 bg-[#9146ff]/[0.08] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#a78bfa]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9146ff]">
                                <TwitchIcon className="w-3 fill-white" />
                            </span>
                            BETA — Twitch API
                        </div>
                        <h2 className="mb-5 text-[clamp(2.8rem,4.5vw,4.5rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#fafafa]">
                            Comandos para tu
                            <br />
                            <span className={GRADIENT_TEXT}>Stream.</span>
                        </h2>
                        <p className="mb-8 text-lg leading-relaxed text-[#c4c4cc]">
                            Configura <code className={CMD_CODE}>!followage</code>,{' '}
                            <code className={CMD_CODE}>!clip</code>, <code className={CMD_CODE}>!shoutout</code> y más
                            en segundos. Sin complicaciones.
                        </p>
                        <div className="mb-6 flex flex-wrap justify-center gap-4 md:justify-start">
                            {hasSession ? (
                                <a
                                    href={appPath('/dashboard/')}
                                    className="inline-flex items-center gap-2.5 rounded-lg bg-[#9146ff] px-7 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-[#7c3aed] no-underline"
                                >
                                    Ir al Panel
                                    <ArrowRight className="w-4" />
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setDisclaimerOpen(true)}
                                    className="inline-flex items-center gap-2.5 rounded-lg bg-[#9146ff] px-7 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-[#7c3aed]"
                                >
                                    <TwitchIcon className="w-4 fill-current" />
                                    Iniciar Sesión con Twitch
                                </button>
                            )}
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-[22px] py-[11px] text-[0.9rem] font-medium text-[#c4c4cc] no-underline transition hover:border-white/25 hover:text-[#fafafa]"
                            >
                                Ver funciones <ArrowRight className="w-4" />
                            </a>
                        </div>
                        <p className="mb-6 text-[0.8rem] text-[#71717a]">
                            * Al conectar aceptas nuestra{' '}
                            <a
                                href={legalPath('privacidad')}
                                className="text-[#c4c4cc] underline underline-offset-2 transition hover:text-primary"
                            >
                                política de privacidad
                            </a>{' '}
                            y{' '}
                            <a
                                href={legalPath('terminos')}
                                className="text-[#c4c4cc] underline underline-offset-2 transition hover:text-primary"
                            >
                                términos de uso
                            </a>
                            .
                        </p>
                    </div>

                    <div className="relative hidden items-center justify-center md:flex">
                        <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111]">
                            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                                    <span className="ml-2 font-mono text-xs text-white/60">bash — 80x24</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void copyTerminal()}
                                    className="flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white/80"
                                >
                                    {isCopied ? <Check className="w-3.5 text-[#10b981]" /> : <Copy className="w-3.5" />}
                                    <SlotText text={isCopied ? "Copiado" : "Copiar"} />
                                </button>
                            </div>
                            <div className="space-y-0 p-5 font-mono text-[0.85rem] leading-8">
                                <div>
                                    <span className="text-[#61afef]">$</span>
                                    <span className="text-[#e5c07b]"> curl</span>
                                    <span className="text-[#98c379]">
                                        {' '}
                                        -G &quot;https://api.losperris.dev/twitch/followage&quot;
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#e5c07b]"> -d</span>
                                    <span className="text-[#98c379]"> &quot;channel=losperris&quot;</span>
                                </div>
                                <div>
                                    <span className="text-[#e5c07b]"> -d</span>
                                    <span className="text-[#98c379]"> &quot;user=mynana17&quot;</span>
                                </div>
                                <div>
                                    <span className="text-[#e5c07b]"> -d</span>
                                    <span className="text-[#98c379]"> &quot;apiKey=</span>
                                    <span className="text-[#e5c07b]">sk_a1b2c3d4...</span>
                                    <span className="text-[#98c379]">&quot;</span>
                                </div>
                                <div className="mt-2 border-t border-white/[0.05] pt-2 text-white/70">
                                    @mynana17 sigue losperris desde hace 2 años y 1 mes.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="scroll-mt-[100px] py-16 md:py-24">
                    <div className="mb-12 text-center">
                        <span className="mb-6 inline-block rounded-md border border-[#9146ff]/20 bg-[#9146ff]/10 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-[#a78bfa]">
                            Funcionalidades
                        </span>
                        <h2 className="text-5xl font-bold leading-tight tracking-tight text-white">
                            Funciones de la <span className={GRADIENT_TEXT}>API</span>
                        </h2>
                        <p className="mx-auto mt-4 max-w-[650px] text-lg text-[#c4c4cc]">
                            Todo lo que necesitas para tu stream.
                        </p>
                    </div>

                    <div className="space-y-20">
                        {FEATURE_CATEGORIES.map((cat) => (
                            <div key={cat.title}>
                                <div className="mb-12 text-center">
                                    <h3 className="text-4xl font-bold tracking-tight text-white">{cat.title}</h3>
                                    <p className="mx-auto mt-3 max-w-[600px] text-[#71717a]">{cat.description}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
                                    {cat.cards.map((card) => (
                                        <div
                                            key={card.title}
                                            className="flex min-h-[200px] flex-col items-center rounded-xl border border-white/[0.08] bg-[#0a0a0b] p-8 text-center transition hover:border-[#9146ff]/40"
                                        >
                                            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#9146ff]/20 bg-[#9146ff]/10 text-xl text-[#a78bfa]">
                                                <card.icon className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-white">{card.title}</h4>
                                            <p className="mt-1.5 text-[#c4c4cc]">{card.text}</p>
                                            {'tag' in card && card.tag && (
                                                <span className="mt-2 inline-block rounded border border-[#9146ff]/20 bg-[#9146ff]/10 px-2 py-1 font-mono text-xs text-[#a78bfa]">
                                                    {card.tag}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="pb-20 pt-8">
                    <div className="mb-12 text-center">
                        <h2 className="text-4xl font-bold tracking-tight text-white">
                            Preguntas <span className={GRADIENT_TEXT}>Frecuentes</span>
                        </h2>
                        <p className="mt-3 text-[#71717a]">Resuelve tus dudas sobre la API</p>
                    </div>
                    <div className="mx-auto flex max-w-[800px] flex-col">
                        <Accordion 
                            items={FAQ_ITEMS.map((item) => ({
                                id: item.q,
                                title: item.q,
                                content: item.a
                            }))} 
                        />
                    </div>
                </section>
            </div>

            <LoginDisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
            <VerifyingSessionModal open={isVerifying} />
        </div>
    );
}
