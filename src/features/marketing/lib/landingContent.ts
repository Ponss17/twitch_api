export const DISCORD_COMMUNITY_URL = 'https://discord.gg/PJbExZe7Tp';

/** Misma forma que los botones del panel (`rounded-lg`). */
export const landingBtnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-[0.8125rem] font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-primary-hover';

export const landingBtnSecondary =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-secondary px-5 py-2 text-[0.8125rem] font-semibold text-text-main no-underline transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-white/[0.02]';

export const landingBtnHeader =
    'inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-primary-hover';

/** Estructura visual del hero; copy en `t.landing.hero.tabs`. */
export const PRODUCT_TABS = [
    { id: 'inicio' as const, src: '/img/ss/home.png' },
    { id: 'comandos' as const, src: '/img/ss/comando.png' },
    { id: 'herramientas' as const, src: '/img/ss/herramientas.png' },
    { id: 'minijuegos' as const, src: '/img/ss/minijuego.png' }
];

/** Pasos; copy en `t.landing.features.steps`. */
export const FEATURE_STEPS = [
    { n: '01', visual: 'connect' as const },
    { n: '02', visual: 'generate' as const },
    { n: '03', visual: 'bots' as const }
];

/** Bloques del panel; copy en `t.landing.features.panels`. */
export const PANEL_ITEMS = [
    { id: 'commands' as const },
    { id: 'tools' as const },
    { id: 'minigames' as const }
];

/** Puntos “para quién”; copy en `t.landing.fit.points`. */
export const FIT_POINTS = [{ id: 'free' as const }, { id: 'browser' as const }, { id: 'bots' as const }];

/** Demos de chat; label/reply en `t.landing.fit.demos`. */
export const FIT_DEMOS = [
    {
        id: 'followage' as const,
        command: '!followage',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const
    },
    {
        id: 'watchtime' as const,
        command: '!watchtime',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const
    },
    {
        id: '8ball' as const,
        command: '!8ball ¿gane ranked?',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const
    },
    {
        id: 'so' as const,
        command: '!so mynana17',
        user: 'ponss17',
        color: '#FF4500',
        role: 'broadcaster' as const
    }
];

/** FAQ; copy en `t.landing.faq.items`. */
export const FAQ_ITEMS = [
    { id: 'gratis' as const },
    { id: 'bots' as const },
    { id: 'empezar' as const },
    { id: 'permisos' as const },
    { id: 'obs' as const }
];
