/** Fragmento i18n: home (es). */
export const home = {
home: {
        title: 'Inicio',
        tabs: {
            home: 'Inicio',
            analytics: 'Analíticas',
            settings: 'Ajustes',
        },
        welcome: 'Bienvenido',
        quickStats: 'Estadísticas Rápidas',
        recentActivity: 'Actividad Reciente',
        noActivity: 'Sin actividad reciente.',
        requests: 'solicitudes',
        successRate: 'tasa de éxito',
        avgLatency: 'latencia media',
        today: 'hoy',
        broadcaster: {
            partner: 'Partner',
            affiliate: 'Afiliado',
            streamer: 'Streamer'
        },
        resources: {
            title: 'Recursos',
            commands: 'Más usados',
            links: 'Enlaces útiles',
            about: 'Sobre la API',
            docs: 'Documentación',
            status: 'Status del Sistema'
        },
        activityFeed: {
            title: 'Historial de Actividad',
            subtitle: 'Filtra por categoría o recurso en tiempo real •',
            syncing: 'Sincronizando...',
            liveBadge: 'EN VIVO',
            liveTooltip: 'Filtra por categoría o recurso. Los eventos nuevos siguen entrando en vivo.',
            emptyFiltered: 'Sin resultados',
            emptyAll: 'Sin actividad todavía',
            emptyFilteredDesc: 'Prueba otro filtro o vuelve a Todos.',
            emptyAllDesc: 'Cuando alguien use un comando en tu chat, aparecerá aquí.',
            emptyWithOnboarding: 'El historial se llenará solo',
            emptyWithOnboardingDesc: 'Mientras tanto, configura un comando arriba.',
            all: 'Todos'
        },
        onboarding: {
            welcomeTitle: 'Bienvenido a LosPerrisAPI',
            welcomeBody: 'Permíteme mostrarte las funciones principales con un tour rápido para que empieces enseguida.',
            start: 'Empezar',
            skip: 'Saltar',
            back: 'Atrás',
            next: 'Siguiente',
            finish: 'Terminar',
            stepOf: 'Paso {step} de {total}',
            doneTitle: '¡Ya lo tienes todo!',
            doneBody: 'Gracias por hacer el tour. Disfruta el panel y no dudes en explorar cada sección a tu ritmo.',
            doneBtn: 'Empezar a usar',
            steps: {
                'sidebar-nav': {
                    title: 'Menú de navegación',
                    body: 'Desde aquí navegas entre todas las secciones: Inicio, Analíticas, Reportes, Comandos, Herramientas y Minijuegos. En escritorio puedes colapsarlo a iconos para ganar más espacio.'
                },
                'home-hero': {
                    title: 'Resumen de tu canal',
                    body: 'Seguidores totales, tipo de canal y fecha de inicio. Esta tarjeta se actualiza con tus datos reales de Twitch cada vez que entras.'
                },
                'home-activity': {
                    title: 'Actividad en tiempo real',
                    body: 'Cada vez que alguien use un comando en tu chat aparece aquí al instante vía WebSocket. Filtra por categoría o haz clic en cualquier entrada para ver los detalles completos.'
                },
                'home-resources': {
                    title: 'Accesos rápidos',
                    body: 'Los 3 comandos que más usas esta semana, links directos a la API y a la documentación. Se actualiza solo según tu actividad.'
                },
                analytics: {
                    title: 'Analíticas del canal',
                    body: 'Gráficas de uso por día, semana o mes. Compara qué comandos y herramientas son más populares en tu comunidad.'
                },
                followage: {
                    title: 'Generador de comandos',
                    body: 'Copia la URL lista para Nightbot, StreamElements o cualquier bot. Elige el formato, el idioma y prueba la respuesta directamente desde aquí.'
                }
            }
        },
        activityLog: {
            categories: {
                all: 'Todos',
                commands: 'Comandos',
                tools: 'Herramientas',
                minigames: 'Minijuegos'
            },
            relativeTime: {
                now: 'ahora',
                minutes: (mins: number): string => `hace ${mins} min`,
                hours: (hours: number): string => `hace ${hours} h`
            },
            date: {
                today: 'Hoy',
                yesterday: 'Ayer'
            },
            types: {
                clip: { label: 'Clip', defaultDetail: 'Nuevo clip' },
                followage: { label: 'Followage', defaultDetail: 'Consulta de followage', channel: (target: string): string => `Canal: ${target}` },
                watchtime: { label: 'Watchtime', defaultDetail: 'Consulta de watchtime', channel: (target: string): string => `Canal: ${target}` },
                shoutout: { label: 'Shoutout', defaultDetail: 'Shoutout enviado', to: (target: string): string => `A: ${target}` },
                message: { label: 'Mensaje', defaultDetail: 'Mensaje en chat' },
                russian: { label: 'Ruleta Rusa', defaultDetail: 'Partida de ruleta rusa', channel: (target: string): string => `Canal: ${target}` },
                magic8: { label: 'Bola 8', defaultDetail: 'Pregunta a la bola 8' },
                duel: { label: 'Duelo', defaultDetail: 'Duelo iniciado', vs: (target: string): string => `vs @${target}` },
                slots: { label: 'Slots', defaultDetail: 'Tirada de slots' },
                stalker: { label: 'Stalker', defaultDetail: 'Escaneo de stalker' },
                trends: { label: 'Tendencias', defaultDetail: 'Rastreo de tendencias' },
                roulette: { label: 'Ruleta', defaultDetail: 'Ruleta de chatters' },
                other: { label: 'Actividad', defaultDetail: 'Evento registrado' }
            }
        },
        activityInspector: {
            title: 'Inspector de Evento',
            date: 'Fecha',
            time: 'Hora',
            user: 'Usuario',
            summary: 'Resumen',
            technicalMetadata: 'Metadatos Técnicos',
            copy: 'Copiar',
            unknownDate: 'Desconocida',
            unknownTime: '---',
            emptyMetadata: 'Sin metadatos adicionales',
            fieldType: 'Tipo',
            fieldTimestamp: 'Timestamp',
            fieldTarget: 'Objetivo',
            fieldTitle: 'Título',
            fieldUrl: 'URL',
            fieldMessage: 'Mensaje',
            fieldQuestion: 'Pregunta',
            fieldResponse: 'Respuesta',
            fieldSource: 'Origen',
            fieldAnnounce: 'Anuncio',
            fieldAction: 'Acción',
            fieldClipId: 'ID del clip',
            fieldLatency: 'Latencia',
            fieldLang: 'Idioma',
            fieldFormat: 'Formato',
            fieldMood: 'Mood',
            fieldHardcore: 'Hardcore',
            fieldRawDetail: 'Detalle',
            rawJson: 'event.json'
        }
    }
};
