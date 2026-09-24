/** Fragmento i18n: landing (es). */
export const landing = {
landing: {
        nav: {
            sectionsAria: 'Secciones',
            product: 'Producto',
            docs: 'Docs',
            discord: 'Discord'
        },
        cta: {
            start: 'Empezar',
            reconnect: 'Volver a conectar con Twitch',
            panelShort: 'Panel',
            goToPanel: 'Ir al Panel',
            panelAria: 'Panel de control'
        },
        resources: {
            docsTitle: 'Documentación Oficial',
            docsText:
                'Guías paso a paso, variables para comandos y tutoriales detallados para que configures tu panel y tus integraciones en minutos.',
            docsCta: 'Leer la Docs',
            discordTitle: 'Comunidad en Discord',
            discordText:
                'Únete a nuestro servidor. Resuelve tus dudas en tiempo real, sugiere nuevas funciones y conoce a otros creadores como tú.',
            discordCta: 'Unirse al servidor'
        },
        features: {
            stepsTitle: 'Empieza con un comando',
            stepsSubtitle: 'Fácilmente en 3 pasos. Todo desde el navegador.',
            panelTitle: 'Todo en un panel',
            panelSubtitle: 'Comandos, overlays y minijuegos. Sin otro programa.',
            steps: {
                connect: {
                    title: 'Conecta Twitch',
                    text: 'Entras con tu cuenta de streamer. Todo funciona directo en el navegador, sin necesidad de instalar programas adicionales.'
                },
                generate: {
                    title: 'Genera el comando',
                    text: 'Eliges followage, watchtime, clips o shoutout. El panel arma el comando con tu API key, listo para copiar.'
                },
                bots: {
                    title: 'Pégalo en tu bot',
                    text: 'Nightbot, StreamElements o Streamlabs. Lo pegas como comando custom y el chat ya lo puede usar.'
                }
            },
            panels: {
                commands: {
                    title: 'Comandos',
                    text: 'Followage, watchtime, clips y shoutouts. El chat pregunta y el bot responde con el texto que genera la API.',
                    items: ['!followage', '!watchtime', '!clip', '!so']
                },
                tools: {
                    title: 'Herramientas',
                    text: 'Tendencias, stalker, ruleta y preguntas. Varias tienen overlay: la URL va a OBS como fuente de navegador.',
                    items: ['Tendencias', 'Ruleta', 'Preguntas', 'Stalker']
                },
                minigames: {
                    title: 'Minijuegos',
                    text: 'Bola 8, ruleta rusa, duelos y slots. El chat juega solo; tú no dejas el directo.',
                    items: ['!8ball', '!ruleta', '!duelo', '!slots']
                }
            }
        },
        hero: {
            headlineLine1: 'Comandos para tu',
            headlineLine2: 'Stream.',
            subtitle: 'Comandos, overlays y minijuegos. Pégalo en Nightbot, StreamElements, Streamlabs u OBS.',
            legacyNotice: 'Tu sesión anterior ya no es válida. Vuelve a conectar con Twitch.',
            seePanel: 'Ver el panel',
            disclaimerBefore: 'Al conectar aceptas la',
            privacy: 'política de privacidad',
            disclaimerAnd: 'y los',
            terms: 'términos de uso',
            disclaimerAfter: '.',
            tablistAria: 'El panel',
            tabs: {
                inicio: {
                    label: 'Panel',
                    text: 'El panel de LosPerrisAPI: comandos, overlays y minijuegos en un solo sitio.'
                },
                comandos: {
                    label: 'Comandos',
                    text: 'El generador arma el comando para Nightbot, StreamElements o Streamlabs.'
                },
                herramientas: {
                    label: 'Herramientas',
                    text: 'Overlays en OBS y utilidades del panel, sin otro programa.'
                },
                minijuegos: {
                    label: 'Minijuegos',
                    text: 'El chat juega solo. Tú sigues en el stream.'
                }
            }
        },
        fit: {
            title: 'Solo copias y pegas',
            subtitle: 'Sin instalar otro bot. El comando o la URL van a Nightbot, StreamElements, Streamlabs u OBS.',
            chatTitle: 'Chat del stream',
            welcome: '¡Te damos la bienvenida a la sala de chat de ponss17!',
            hello: 'buenas',
            sendPlaceholder: 'Enviar un mensaje',
            demoTabsAria: 'Probar comando',
            moderator: 'Moderador',
            streamer: 'Streamer',
            points: {
                free: {
                    title: '100% Gratis',
                    text: 'El panel es completamente gratis y sin costos ocultos.'
                },
                browser: {
                    title: 'Sin instalar',
                    text: 'Todo corre en el navegador. No hay exe ni extensión.'
                },
                bots: {
                    title: 'Sin otro bot',
                    text: 'Sigues con Nightbot, StreamElements o Streamlabs.'
                }
            },
            demos: {
                followage: {
                    label: 'Followage',
                    reply: 'mynana17 ha seguido a ponss17 por 2 años y 3 meses.'
                },
                watchtime: {
                    label: 'Watchtime',
                    reply: 'mynana17 lleva 2 años y 3 meses viendo a ponss17.'
                },
                '8ball': {
                    label: '8ball',
                    reply: 'Los astros se alinean a tu favor, @mynana17... pero tus decisiones futuras me preocupan. SÍ.'
                },
                so: {
                    label: 'Shoutout',
                    reply: '¡Vayan a seguir a mynana17! Estaba jugando Just Chatting'
                }
            }
        },
        faq: {
            title: 'Preguntas frecuentes',
            subtitle: 'Gratis, bots y OBS. Lo que preguntan antes de conectar.',
            items: {
                gratis: {
                    title: '¿Es gratis?',
                    content: 'Sí. LosPerrisAPI es completamente gratis. Puedes usar todas las funciones del panel sin costo.'
                },
                bots: {
                    title: '¿Con qué bots funciona?',
                    content: 'Nightbot, StreamElements y Streamlabs. Copias el comando que genera el panel y lo pegas en tu bot.'
                },
                empezar: {
                    title: '¿Cómo empiezo?',
                    content: 'Conectas Twitch, eliges el comando u overlay y lo pegas en el bot o en OBS. En un minuto está listo.'
                },
                permisos: {
                    title: '¿Qué permisos pide Twitch?',
                    content: 'Solo los necesarios para identificar tu canal y generar los comandos. No publicamos en tu chat ni cambiamos el stream.'
                },
                obs: {
                    title: '¿Puedo usarlo en OBS?',
                    content: 'Sí. Tendencias, ruleta, preguntas y otras herramientas tienen overlay: copias la URL y la pegas como fuente de navegador.'
                }
            }
        },
        users: {
            title: 'Streamers que utilizan la API',
            subtitle: 'Únete a los streamers que ya confían en la API para sus directos.',
            noDescription: 'Sin descripción en Twitch.',
            loadingAria: 'Cargando pioneros',
            twitchChannelAria: (name: string): string => `Canal de Twitch de ${name}`
        }
    }
};
