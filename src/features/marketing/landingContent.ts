export const DISCORD_COMMUNITY_URL = 'https://discord.gg/PJbExZe7Tp';

/** Misma forma que los botones del panel (`rounded-lg`). */
export const landingBtnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-[0.8125rem] font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-primary-hover';

export const landingBtnSecondary =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-bg-secondary px-5 py-2 text-[0.8125rem] font-semibold text-text-main no-underline transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-hover-neutral';

export const landingBtnHeader =
    'inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-primary-hover';

export const PRODUCT_TABS = [
    {
        id: 'inicio',
        label: 'Panel',
        text: 'El panel de LosPerrisAPI: comandos, overlays y minijuegos en un solo sitio.',
        src: '/img/ss/home.png'
    },
    {
        id: 'comandos',
        label: 'Comandos',
        text: 'El generador arma el comando para Nightbot, StreamElements o Streamlabs.',
        src: '/img/ss/comando.png'
    },
    {
        id: 'herramientas',
        label: 'Herramientas',
        text: 'Overlays en OBS y utilidades del panel, sin otro programa.',
        src: '/img/ss/herramientas.png'
    },
    {
        id: 'minijuegos',
        label: 'Minijuegos',
        text: 'El chat juega solo. Tú sigues en el stream.',
        src: '/img/ss/minijuego.png'
    }
] as const;

export const FEATURE_STEPS = [
    {
        n: '01',
        title: 'Conecta Twitch',
        text: 'Entras con tu cuenta de streamer. Todo funciona directo en el navegador, sin necesidad de instalar programas adicionales.',
        visual: 'connect'
    },
    {
        n: '02',
        title: 'Genera el comando',
        text: 'Eliges followage, watchtime, clips o shoutout. El panel arma el comando con tu API key, listo para copiar.',
        visual: 'generate'
    },
    {
        n: '03',
        title: 'Pégalo en tu bot',
        text: 'Nightbot, StreamElements o Streamlabs. Lo pegas como comando custom y el chat ya lo puede usar.',
        visual: 'bots'
    }
] as const;

export const PANEL_ITEMS = [
    {
        title: 'Comandos',
        text: 'Followage, watchtime, clips y shoutouts. El chat pregunta y el bot responde con el texto que genera la API.',
        items: ['!followage', '!watchtime', '!clip', '!so']
    },
    {
        title: 'Herramientas',
        text: 'Tendencias, stalker, ruleta y preguntas. Varias tienen overlay: la URL va a OBS como fuente de navegador.',
        items: ['Tendencias', 'Ruleta', 'Preguntas', 'Stalker']
    },
    {
        title: 'Minijuegos',
        text: 'Bola 8, ruleta rusa, duelos y slots. El chat juega solo; tú no dejas el directo.',
        items: ['!8ball', '!ruleta', '!duelo', '!slots']
    }
] as const;

export const FIT_POINTS = [
    {
        title: '100% Gratis',
        text: 'El panel es completamente gratis y sin costos ocultos.'
    },
    {
        title: 'Sin instalar',
        text: 'Todo corre en el navegador. No hay exe ni extensión.'
    },
    {
        title: 'Sin otro bot',
        text: 'Sigues con Nightbot, StreamElements o Streamlabs.'
    }
] as const;

export const FIT_DEMOS = [
    {
        id: 'followage',
        label: 'Followage',
        command: '!followage',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const,
        reply: 'mynana17 ha seguido a ponss17 por 2 años y 3 meses.'
    },
    {
        id: 'watchtime',
        label: 'Watchtime',
        command: '!watchtime',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const,
        reply: 'mynana17 lleva 2 años y 3 meses viendo a ponss17.'
    },
    {
        id: '8ball',
        label: '8ball',
        command: '!8ball ¿gane ranked?',
        user: 'mynana17',
        color: '#FF69B4',
        role: 'viewer' as const,
        reply: 'Los astros se alinean a tu favor, @mynana17... pero tus decisiones futuras me preocupan. SÍ.'
    },
    {
        id: 'so',
        label: 'Shoutout',
        command: '!so mynana17',
        user: 'ponss17',
        color: '#FF4500',
        role: 'broadcaster' as const,
        reply: '¡Vayan a seguir a mynana17! Estaba jugando Just Chatting'
    }
] as const;

export const FAQ_ITEMS = [
    {
        id: 'gratis',
        title: '¿Es gratis?',
        content: 'Sí. LosPerrisAPI es completamente gratis. Puedes usar todas las funciones del panel sin costo.'
    },
    {
        id: 'bots',
        title: '¿Con qué bots funciona?',
        content: 'Nightbot, StreamElements y Streamlabs. Copias el comando que genera el panel y lo pegas en tu bot.'
    },
    {
        id: 'empezar',
        title: '¿Cómo empiezo?',
        content: 'Conectas Twitch, eliges el comando u overlay y lo pegas en el bot o en OBS. En un minuto está listo.'
    },
    {
        id: 'permisos',
        title: '¿Qué permisos pide Twitch?',
        content: 'Solo los necesarios para identificar tu canal y generar los comandos. No publicamos en tu chat ni cambiamos el stream.'
    },
    {
        id: 'obs',
        title: '¿Puedo usarlo en OBS?',
        content: 'Sí. Tendencias, ruleta y otras herramientas tienen overlay: copias la URL y la pegas como fuente de navegador.'
    }
] as const;
