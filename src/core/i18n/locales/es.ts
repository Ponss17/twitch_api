/**
 * @deprecated Importar `Locale` desde `@/core/i18n/I18nContext` (fuente canónica).
 * Mantenido aquí solo para compatibilidad con imports de `Translations`.
 */
export type Locale = 'es' | 'en' | 'pt';

/** Traducciones por defecto en español. */
export const es = {
    legal: {
        introTerms: 'Los presentes términos regulan el acceso y uso de **LosPerrisBot**, disponible en [ttv.losperris.dev](https://ttv.losperris.dev). Al utilizar el sitio, conectar su cuenta de Twitch (la aplicación aparece como **LosPerris - API**) o emplear su API Key, usted acepta estas condiciones y la política de privacidad.',
        introPrivacy: 'La presente política describe el tratamiento de la información personal en [ttv.losperris.dev](https://ttv.losperris.dev) por parte de **LosPerrisBot**. Al conectar Twitch, la aplicación autorizada se identifica como **LosPerris - API**.',
        introCookies: 'Este documento complementa la política de privacidad y describe el uso de almacenamiento local y tecnologías similares en **LosPerrisBot**. No empleamos cookies de publicidad ni vendemos datos derivados de la navegación.',
        sections: [
            {
                title: 'Descripción del servicio',
                content: 'Proporcionamos un panel de control interactivo para Twitch que permite a los streamers interactuar con su audiencia, mediante comandos, minijuegos y un overlay en pantalla. No almacenamos audio, video ni credenciales bancarias.'
            },
            {
                title: 'Obligaciones del usuario',
                content: 'Al iniciar sesión, aceptas que eres el titular de la cuenta de Twitch o tienes autorización para usarla. Puedes exportar o eliminar tus datos en la pestaña Configuración del panel en cualquier momento.'
            },
            {
                title: 'Conductas prohibidas',
                content: 'Queda prohibido el uso del servicio para spam masivo, actividades ilícitas o cualquier acción que infrinja los Términos de Servicio de Twitch. Nos reservamos el derecho de revocar el acceso a cuentas que abusen de los límites de la API.'
            },
            {
                title: 'Limitación de responsabilidad',
                content: 'El servicio se proporciona "tal cual". No garantizamos un 100% de disponibilidad ni nos hacemos responsables de daños directos o indirectos derivados de interrupciones, pérdidas de datos o cambios en la API de Twitch.'
            },
            {
                title: 'Suspensión del servicio',
                content: 'Podemos suspender temporalmente el acceso para realizar mantenimiento o si detectamos tráfico anómalo que ponga en riesgo la infraestructura compartida.'
            },
            {
                title: 'Modificaciones',
                content: 'Podemos modificar estos términos en cualquier momento. El uso continuado del servicio tras los cambios constituye su aceptación.'
            },
            {
                title: 'Quién gestiona los datos',
                content: 'Tus datos son procesados por LosPerrisBot, operando bajo la infraestructura detallada a continuación. Actuamos como intermediarios entre tu cuenta de Twitch y las funciones del panel.'
            },
            {
                title: 'Datos que recopilamos',
                content: 'Recopilamos tu ID de Twitch, login, tipo de afiliado y fecha de creación de la cuenta para proveer la autenticación primaria. Almacenamos tus configuraciones personalizadas (comandos, minijuegos) y un registro temporal de los últimos 200 eventos ocurridos en tu canal para alimentar tu panel.'
            },
            {
                title: 'Datos que no recopilamos',
                content: 'No almacenamos contraseñas (usamos OAuth2). No recopilamos, leemos ni almacenamos mensajes de tu chat que no sean invocaciones a comandos específicos del bot. No recopilamos información de pago ni direcciones.'
            },
            {
                title: 'Uso de los datos',
                content: 'Tus datos se utilizan exclusivamente para habilitar las funcionalidades de tu panel de control, procesar tus configuraciones de minijuegos y estadísticas. No vendemos ni cedemos datos a terceros con fines publicitarios.'
            },
            {
                title: 'Proveedores y terceros',
                content: 'Compartimos datos mínimos estrictamente necesarios con nuestros proveedores de infraestructura: Twitch (autenticación y consulta), Supabase (almacenamiento de perfiles), Vercel (alojamiento y métricas), Groq (procesamiento de texto en la Bola 8) y Discord (solo si envías feedback voluntario).'
            },
            {
                title: 'Conservación de los datos',
                content: 'Los perfiles y la configuración se mantienen mientras la cuenta esté activa. Los registros de actividad del canal se truncan automáticamente a los 200 eventos más recientes por usuario. Si eliminas tu cuenta, se borran inmediatamente de la base de datos principal.'
            },
            {
                title: 'Derechos del usuario',
                content: 'Tienes derecho a conocer qué datos tenemos, corregir datos inexactos, y exportar o eliminar tu cuenta desde la sección Configuración del panel en cualquier momento. La eliminación es permanente.'
            },
            {
                title: 'Cookies y almacenamiento local',
                content: 'Utilizamos cookies de sesión encriptadas y almacenamiento local (localStorage/IndexedDB) estrictamente necesarios para mantener tu sesión activa, cachear estadísticas y persistir tus preferencias del panel (modo oscuro, idioma).'
            },
            {
                title: 'Menores de edad',
                content: 'El servicio está dirigido a usuarios mayores de 13 años (o la edad mínima requerida por Twitch en su país). No recopilamos intencionalmente datos de menores de esa edad.'
            },
            {
                title: 'Seguridad',
                content: 'Implementamos cifrado en tránsito (HTTPS) y en reposo mediante Supabase. Tu token de sesión es de corta duración y se renueva automáticamente. Nunca exponemos tokens de API de Twitch al cliente.'
            },
            {
                title: 'Actualizaciones',
                content: 'Esta política puede ser actualizada. La fecha de última revisión siempre estará visible en la parte inferior de este documento.'
            },
            {
                title: 'Almacenamiento local',
                content: 'Se utiliza localStorage para retener tu API Key, tus preferencias del panel y acelerar la carga de la página almacenando respuestas temporales en caché.'
            },
            {
                title: 'Service worker',
                content: 'Podemos emplear Service Workers para soportar notificaciones o capacidades offline del panel, los cuales residen en tu dispositivo local.'
            },
            {
                title: 'Métricas de rendimiento',
                content: 'Utilizamos Vercel Web Vitals y Speed Insights de forma anónima para monitorizar tiempos de carga e identificar cuellos de botella en la plataforma.'
            },
            {
                title: 'Eliminación del almacenamiento',
                content: 'Puedes limpiar todo el almacenamiento local cerrando sesión, limpiando los datos del sitio en tu navegador, o utilizando el botón de limpiar estadísticas en Configuración.'
            }
        ]
    },
    exporter: {
        home: 'Inicio',
        docs: 'Documentación',
        dashboard: 'Dashboard',
        reportBadge: 'Reporte de cuenta',
        followers: 'Seguidores',
        today: 'Hoy',
        total: 'Total',
        success: 'Éxito',
        profile: 'Perfil',
        accountInfo: 'Información de cuenta',
        name: 'Nombre',
        login: 'Login',
        channelType: 'Tipo de canal',
        memberSince: 'Miembro desde',
        bio: 'Biografía',
        access: 'Acceso',
        securityAndApiKey: 'Seguridad y API Key',
        status: 'Estado',
        active: 'Activa',
        limit: 'Límite',
        level: 'Nivel',
        metrics: 'Métricas',
        apiPerformance: 'Rendimiento de la API',
        recentActivity: 'Actividad Reciente',
        noRecentActivity: 'Sin actividad reciente para mostrar.',
        links: 'Enlaces',
        legal: 'Legal',
        privacyPolicy: 'Política de Privacidad',
        terms: 'Términos',
        generatedOn: 'Generado el',
        at: 'a las'
    },
    verifying: {
        authenticated: 'AUTENTICADO',
        accessGranted: 'Acceso concedido. Redirigiendo...',
        cacheActive: 'Caché local activa — carga rápida.',
        noCache: 'Sincronizando perfil seguro...',
    },
    settings: {
        title: 'Ajustes',
        tabs: {
            general: 'General',
            data: 'Datos',
            security: 'Seguridad',
            connections: 'Conexiones',
            sessionExpiredLogin: 'Sesión expirada. Por favor, inicia sesión de nuevo.',
            overlayExpired: 'Enlace de overlay caducado. Vuelve a generar uno en tu panel.',
            unstableConnection: 'Conexión inestable con Twitch. Reintentando...'
        },
        account: {
            title: 'Cuenta',
            description: 'Identificador y límites de tu plan',
        },
        preferences: {
            title: 'Preferencias',
            description: 'Ajustes de tu cuenta',
            timezone: {
                label: 'Zona Horaria',
                description: 'Tu zona horaria se utiliza para agrupar y mostrar correctamente los días en tus estadísticas y reportes.',
                searchPlaceholder: 'Buscar zona horaria...',
                searchAriaLabel: 'Buscar zona horaria',
                noResults: 'No se encontraron resultados',
                save: 'Guardar',
                saving: 'Guardando...',
            },
            language: {
                label: 'Idioma de la Interfaz',
                description: 'Elige el idioma en que se muestra el panel de control.',
            },
            theme: {
                label: 'Tema de la Interfaz',
                description: 'Elige el esquema de colores de la aplicación.',
                options: {
                    dark: 'Oscuro',
                    light: 'Claro',
                    liga: 'Liga (LDA)',
                    minimal: 'Minimal',
                    matrix: 'Neo Matrix'
                }
            }
        },
        data: {
            title: 'Datos',
            description: 'Exporta la información de tu cuenta',
        },
        toasts: {
            settingsSaved: 'Ajustes guardados correctamente.',
            settingsError: 'Error al guardar los ajustes.',
            networkError: 'Error de red al guardar los ajustes.',
            invalidSession: 'Sesión inválida o CSRF rechazado. Recarga la página.',
            regenError: 'Error al regenerar API Key',
            regenSuccess: 'Nueva API Key generada',
            clearError: 'Error de conexión al limpiar los datos',
            clearSuccess: 'Estadísticas reiniciadas',
            deleteError: 'Error de conexión al eliminar la cuenta',
            deleteSuccess: 'Cuenta eliminada. Redirigiendo...',
            copyKeySuccess: 'API Key copiada',
            copyKeyError: 'No se pudo copiar la API Key',
            copyIdSuccess: 'ID copiado',
            limitError: 'Error de conexión al verificar límite.',
            connectionError: 'Error de conexión.',
            discordUnlinkError: 'No se pudo desvincular Discord',
            discordUnlinkSuccess: 'Discord desvinculado',
            profileError: 'Error al cargar perfil',
            discordLinkSuccess: 'Discord vinculado correctamente',
            discordLinkTaken: 'Ese Discord ya está vinculado a otra cuenta',
            discordLinkAuth: 'Debes iniciar sesión para vincular Discord',
            discordLinkConfig: 'La vinculación con Discord no está disponible ahora',
            discordLinkError: 'No se pudo vincular Discord',
            exportLimitError: 'Debes esperar para generar otro reporte.'
        },
        dangerModals: {
            resetTitle: 'Reiniciar Estadísticas',
            resetDesc: 'Esta acción borrará todo el historial de comandos, clips y latencia. Tu cuenta y API Key seguirán activas.',
            resetWord: 'LIMPIAR',
            resetConfirm: 'Confirmar y Borrar',
            deleteTitle: 'Eliminar Perfil de LosPerris API',
            deleteDesc: '¡ATENCIÓN! Esta acción es irreversible dentro de nuestra plataforma. Se borrarán tus datos y API Key. Esto NO afectará a tu canal ni cuenta de Twitch de ninguna manera.',
            deleteWord: 'ELIMINAR',
            deleteConfirm: 'Confirmar y Borrar'
        },
        hero: {
            hello: 'Hola,',
            welcome: 'Bienvenido a tu panel · actividad y accesos rápidos',
            followers: 'Seguidores',
            channelType: 'Tipo Canal',
            memberSince: 'Miembro Desde',
            notAvailable: 'No disponible ahora mismo'
        },
        groups: {
            account: { title: 'Cuenta', desc: 'Identificador y límites de tu plan' },
            preferences: { title: 'Preferencias', desc: 'Ajustes de tu cuenta' },
            data: {
                title: 'Datos de Cuenta',
                desc: 'Información y gestión de datos.',
                firstLogin: 'Primer Ingreso',
                firstLoginDesc: 'Fecha en la que iniciaste sesión por primera vez.',
                lastLogin: 'Último Ingreso Previo',
                lastLoginDesc: 'Fecha de tu última sesión antes de la actual.'
            },
            export: { title: 'Exportar', desc: 'Exporta la información de tu cuenta' },
            security: { title: 'Seguridad', desc: 'Claves y accesos' },
            dangerZone: { title: 'Zona de Peligro', desc: 'Acciones destructivas' },
            discord: { title: 'Discord', desc: 'Integraciones' }
        },
        panels: {
            userId: 'User ID',
            copyUserId: 'Copiar User ID',
            planAndQuota: 'Plan y cuota',
            planTooltip: 'Tu plan de API: más alto = más cuota y datos más frescos',
            apiQuotaTooltip: 'Peticiones por minuto con tu API Key (comandos e integraciones)',
            heavyQuotaTooltip: 'Cuota de endpoints pesados (clips / chatters) con API Key',
            cacheTooltip: 'Retención de caché de comandos de bot (followage, etc.)',
            planTier: 'Plan',
            requestsLimit: 'Peticiones / min',
            heavyLimit: 'Pesadas / 10m',
            cacheTime: 'Caché (min)',
            apiKeyPrivate: 'API Key privada',
            apiKeyInfo: 'Mantén esta información privada. No la compartas en directo.',
            apiKeyWarning: 'Tu clave personal e intransferible. Úsala en Nightbot, StreamElements, etc.',
            activeKey: 'API Key Activa',
            activeKeyDesc: 'Lista para autenticar peticiones (Bearer).',
            toggleVisibility: 'Ver/Ocultar',
            copyKey: 'Copiar',
            regenKey: 'Regenerar',
            dangerZoneTitle: 'Zona de Peligro',
            resetStats: 'Reiniciar Estadísticas',
            resetStatsDesc: 'Limpia el uso histórico y analíticas. No afecta a tu cuenta.',
            deleteAccount: 'Eliminar Cuenta',
            deleteAccountDesc: 'Borra todos tus datos permanentemente y cierra tu sesión.',
            discordTitle: 'Discord',
            discordStatus: (linked: boolean): string => (linked ? 'Conectado' : 'No conectado'),
            linkDiscord: 'Vincular Discord',
            unlinkDiscord: 'Desvincular Discord',
            fullReport: 'Reporte de Cuenta Completo',
            exportReport: 'Exportar Datos',
            exportDesc: 'Descarga un archivo JSON con tu historial de actividad y ajustes para cumplir con la portabilidad de datos.'
        },
    },
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
            commands: 'Comandos frecuentes',
            links: 'Enlaces útiles',
            about: 'Sobre la API',
            docs: 'Documentación',
            status: 'Status del Sistema'
        },
        activityFeed: {
            title: 'Historial de Actividad',
            subtitle: 'Filtra por categoría o recurso en tiempo real •',
            syncing: 'Sincronizando...',
            liveTooltip: 'Filtra por categoría o recurso. Los eventos nuevos siguen entrando en vivo.',
            emptyFiltered: 'Sin resultados',
            emptyAll: 'Sin actividad todavía',
            emptyFilteredDesc: 'Prueba otro filtro o vuelve a Todos.',
            emptyAllDesc: 'Cuando alguien use un comando en tu chat, aparecerá aquí.',
            all: 'Todos'
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
            unknownTime: '---'
        }
    },
    analytics: {
        other: 'Otros',
        kpis: {
            title: 'Rendimiento Global',
            info: 'Métricas agregadas del uso de tu API.',
            today: 'Hoy',
            sevenDays: '7d',
            requests: 'Peticiones Totales',
            successRate: 'Tasa de Éxito',
            latency: 'Latencia Media',
            commands: 'Comandos Usados',
            requestsToday: 'Peticiones hoy',
            requests7d: 'Peticiones en 7 días',
            successToday: 'Éxito hoy',
            success7d: 'Éxito en 7 días',
            latencyToday: 'Tiempo de respuesta hoy',
            latency7d: 'Tiempo de respuesta en 7 días',
            commandsToday: 'Comandos únicos hoy',
            commands7d: 'Comandos únicos en 7 días'
        },
        todayChart: {
            title: 'Actividad Hoy',
            info: 'Peticiones de cada comando hoy.',
            success: 'Éxitos',
            errors: 'Errores',
            successRate: 'Tasa de Éxito',
            total: 'Total Peticiones',
            noData: 'Sin datos hoy',
            noDataSub: 'Usa algún comando'
        },
        latencyChart: {
            title: 'Rendimiento y Latencia',
            info: 'Tiempo de respuesta por comando.',
            noData: 'Sin latencia',
            noDataSub: 'Esperando datos',
            latency: 'Latencia Media'
        },
        endpointsTable: {
            title: 'Comandos más usados',
            info: 'Lista de comandos con peticiones, éxito y latencia media.',
            noData: 'Sin datos suficientes',
            noDataSub: 'Ejecuta comandos en tu canal para generar historial',
            headers: {
                command: 'Comando',
                requests: 'Peticiones',
                success: 'Éxito',
                latency: 'Latencia'
            }
        },
        distributionChart: {
            title: 'Distribución de Comandos',
            info: 'Peticiones por cada comando.',
            noData: 'Sin comandos',
            noDataSub: 'Inicia actividad'
        },
        areaChart: {
            title: 'Tráfico y Errores (7 días)',
            info: 'Historial de los últimos 7 días. El día actual se actualiza en vivo.',
            requests: 'Peticiones',
            noData: 'Sin actividad',
            noDataSub: 'Esperando eventos'
        },
        leaderboard: {
            title: 'Top Usuarios',
            infoToday: 'Usuarios más activos hoy.',
            info7d: 'Usuarios más activos en 7 días.',
            noData: 'Sin usuarios',
            noDataSub: 'Esperando interacciones',
            rankingToday: 'Top Hoy',
            ranking7d: 'Top 7 Días',
            totalInteractions: 'interacciones',
            totalInteractionsTooltip: 'Total de usos por todos los viewers',
            unitSingular: 'uso',
            unitPlural: 'usos'
        }
    },
    header: {
        subtitles: {
            home: 'Resumen de tu actividad reciente',
            analytics: 'Estadísticas detalladas de tu API',
            settings: 'Configuración de tu cuenta',
            followage: 'Verifica cuánto tiempo lleva alguien siguiendo',
            watchtime: 'Verifica cuánto tiempo lleva alguien viendo el stream',
            clips: 'Explora y gestiona tus clips de Twitch',
            shoutout: 'Promociona a otros streamers en tu canal',
            trends: 'Descubre las palabras más usadas en tu chat',
            stalker: 'Monitorea mensajes de usuarios específicos',
            roulette: 'Sorteos rápidos e interactivos',
            magic8: 'Respuestas divertidas a preguntas del chat',
            russian: 'Minijuego de ruleta rusa para espectadores',
            duel: 'Enfrentamientos 1vs1 entre usuarios',
            slots: 'Tragamonedas sencilla para el chat',
            questions: 'Recoge y gestiona preguntas del chat',
            feedback: 'Envíanos sugerencias o reporta errores',
            default: 'Panel de Control'
        },
        closeMenu: 'Cerrar menú',
        openMenu: 'Abrir menú',
        accountMenu: 'Menú de cuenta',
        myAccount: 'MI CUENTA',
        settings: 'Ajustes',
        twitchProfile: 'Perfil de Twitch',
        supportProject: 'Apoyar Proyecto',
        logout: 'Cerrar Sesión'
    },
    sidebar: {
        categories: {
            general: 'General',
            commands: 'Comandos',
            tools: 'Herramientas',
            minigames: 'Minijuegos',
            support: 'Soporte'
        },
        items: {
            home: 'Inicio',
            analytics: 'Analíticas',
            followage: 'Followage',
            watchtime: 'Watchtime',
            clips: 'Clips',
            shoutout: 'Shoutout',
            trends: 'Tendencias',
            stalker: 'Stalker',
            roulette: 'Ruleta',
            magic8: 'Bola 8',
            russian: 'Ruleta Rusa',
            duel: 'Duelo',
            slots: 'Slots',
            questions: 'Preguntas',
            feedback: 'Feedback',
            settings: 'Ajustes'
        },
        docs: 'Documentación',
        discord: 'Comunidad',
        navigation: 'Navegación del panel'
    },
    common: {
        channel: 'Canal',
        save: 'Guardar',
        saving: 'Guardando...',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        copy: 'Copiar',
        copied: 'Copiado',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        tabError: 'Error al cargar la pestaña',
        aria: {
            close: 'Cerrar',
            closePanel: 'Cerrar panel',
            moreInfo: 'Más información',
            verifyingSession: 'Verificando sesión',
            legalSections: 'Secciones legales',
            settingsSections: 'Secciones de ajustes',
            feedbackIdentity: 'Identidad del feedback',
            streamingPlatform: 'Plataforma de streaming',
            filterResource: 'Filtrar por recurso'
        }
    },
    globals: {
        loading: {
            dashboard: 'Cargando dashboard',
            panel: 'Cargando panel',
            profile: 'Cargando perfil',
            clips: 'Cargando clips',
            analytics: 'Cargando analíticas',
            commands: 'Cargando comandos',
            trends: 'Cargando tendencias',
            stalker: 'Cargando stalker',
            settings: 'Cargando ajustes',
            starting: 'Iniciando…'
        },
        toasts: {
            offline: 'Conexión perdida. Intentando reconectar...',
            online: 'Conexión restablecida con Twitch.',
            sessionExpiredLogin: 'Sesión expirada. Por favor, inicia sesión de nuevo.',
            unstableConnection: 'Conexión inestable con Twitch. Reintentando...',
            rouletteLoadError: 'Error al cargar datos de ruleta.',
            rouletteChatError: 'Error al conectar con el chat.',
            rouletteSendError: 'Error al enviar mensaje.',
            rouletteWinner: (username: string, count: number): string => `¡Ganador: ${username} (${count} inscripciones)!`,
            rouletteChatWinner: (username: string, count: number): string =>
                `@${username} ha ganado la ruleta (${count} inscripciones)`,
            rouletteInscriptionsClosed: 'Inscripciones cerradas.',
            rouletteMissingFilter: 'Falta filtro de inscripción.',
            rouletteInscriptionsOpened: 'Inscripciones abiertas.',
            rouletteAnnounceOn: 'Anuncios activados.',
            rouletteAnnounceOff: 'Anuncios desactivados.',
            rouletteNoParticipantsLeft: 'No quedan participantes para re-sortear.',
            trendsChatError: 'Error en chat de tendencias.',
            trendsWinner: (word: string, count: number): string => `¡Tendencia ganadora: ${word} (${count} menciones)!`,
            trendsTimeUp: '¡Tiempo agotado!',
            trendsStarted: (minutes: number): string => `Tendencias iniciadas por ${minutes} minutos.`,
            overlayExpired: 'Enlace de overlay expirado.',
            sessionExpired: 'Sesión expirada.'
        }
    },
    modals: {
        userInspect: {
            close: 'Cerrar',
            rank: 'Rango',
            userId: 'ID Usuario',
            copyId: 'Copiar ID',
            copied: 'Copiado',
            accountAge: 'Antigüedad',
            noBio: 'Sin biografía.',
            chatHistory: 'Historial del chat',
            noMessages: 'Sin mensajes registrados en esta sesión.',
            accountCreated: (date: string) => `Cuenta creada: ${date}`,
            viewHistory: 'Ver historial del chat'
        },
        danger: {
            typeToConfirm: (word: string): string => `Escribe "${word}" para confirmar`,
            placeholder: 'Escribe aquí...',
            processing: 'Procesando...',
            cancel: 'Cancelar',
            defaultConfirm: 'Confirmar y Borrar',
        },
        regenKey: {
            title: 'Regenerar API Key',
            prefixWarning: 'Al regenerar, ',
            warning: 'la clave anterior dejará de funcionar',
            desc1: 'Esto significa que:',
            point1: 'Tendrás que actualizar todos tus bots y herramientas.',
            point2: 'No podrás recuperar la clave anterior.',
            disclaimer: 'Esta acción no se puede deshacer.',
            confirm: 'Regenerar',
            regenerating: 'Regenerando...',
            cancel: 'Cancelar',
        },
        postRegenKey: {
            title: 'Nueva API Key',
            desc1: 'Por favor, copia tu nueva clave:',
            point1: 'Guárdala en un lugar seguro.',
            point2: 'No la compartas con nadie.',
            disclaimer: 'Si la pierdes, tendrás que generar otra.',
            copy: 'Copiar al portapapeles',
            copied: '¡Copiada!',
        },
        discordLink: {
            title: 'Vincular Discord',
            continue: 'Continuar',
            desc1: 'Estás a punto de vincular tu cuenta de Discord.',
            desc2: 'Al hacerlo:',
            point1: 'Podrás usar comandos desde Discord.',
            point2: 'Tu cuenta estará más segura.',
            point3: 'Recibirás notificaciones importantes.',
            disclaimer: 'Puedes desvincularla en cualquier momento.',
        },
        discordUnlink: {
            title: 'Desvincular Discord',
            unlinking: 'Desvinculando...',
            confirm: 'Desvincular',
            descUsername: (username: string): string => `Estás a punto de desvincular la cuenta: ${username}`,
            descNoUsername: 'Estás a punto de desvincular tu cuenta de Discord.',
            desc2: 'Al hacerlo:',
            point1: 'Ya no podrás usar comandos desde Discord.',
            point2: 'Tus datos de Discord serán eliminados.',
            point3: 'Dejarás de recibir notificaciones.',
            disclaimer: 'Puedes volver a vincularla más tarde.',
        },
        discordResult: {
            close: 'Cerrar',
            gotIt: 'Entendido',
            linked: {
                title: 'Discord Vinculado',
                lead: 'Tu cuenta ha sido vinculada.',
                points: ['Ya puedes usar los comandos.', 'Tu cuenta está asegurada.'],
                hint: '¡Gracias por usar LosPerris API!',
            },
            unlinked: {
                title: 'Discord Desvinculado',
                lead: 'Tu cuenta ha sido desvinculada.',
                points: ['Tus datos han sido eliminados.', 'Ya no recibirás notificaciones.'],
            },
            errorTaken: {
                title: 'Error de Vinculación',
                lead: 'Esta cuenta ya está en uso.',
                points: ['Intenta con otra cuenta.', 'Contacta al soporte si crees que es un error.'],
            },
            errorAuth: {
                title: 'Error de Autenticación',
                lead: 'No pudimos verificar tu cuenta.',
                points: ['Vuelve a intentarlo.', 'Asegúrate de haber iniciado sesión.'],
            },
            errorConfig: {
                title: 'Error de Configuración',
                lead: 'Hay un problema con la configuración.',
                points: ['Contacta al soporte.', 'Intenta de nuevo más tarde.'],
            },
            error: {
                title: 'Error Desconocido',
                lead: 'Algo salió mal.',
                points: ['Intenta de nuevo.', 'Si el problema persiste, contáctanos.'],
            },
        },
        login: {
            cancel: 'Cancelar',
            title: 'Autorización Requerida',
            validating: 'Conectando...',
            accept: 'Conectar con Twitch',
            desc1: 'Para acceder al Dashboard, necesitas vincular tu canal de ',
            desc1Bold: 'Twitch',
            desc1End: '.',
            desc2: 'Al continuar, autorizas a LosPerris a:',
            point1: 'Leer la información pública de tu canal.',
            point2: 'Ver y gestionar analíticas de streaming en tiempo real.',
            point3: 'Sincronizar y administrar los comandos del chat.',
            disclaimer: 'La conexión es completamente segura mediante Twitch OAuth. No tenemos acceso ni almacenamos tu contraseña. Puedes revocar estos permisos en cualquier momento desde la configuración de conexiones de tu cuenta de Twitch.',
            privacyLink: 'Política de Privacidad',
            termsLink: 'Términos de Servicio'
        },
    },
    clips: {
        title: 'Clips',
        info: 'Explora y gestiona tus clips de Twitch.',
        btnFavsOnly: 'Mostrar solo favoritos',
        btnReload: 'Recargar clips',
        tooltip: 'Gestión de clips',
        searchPlaceholder: 'Buscar clips...',
        sortLabel: 'Ordenar por',
        noClips: 'No se encontraron clips.',
        viewClip: 'Ver Clip',
        playClip: (title: string): string => `Reproducir clip: ${title}`,
        favorite: 'Añadir a favoritos',
        copyLink: 'Copiar enlace',
        untitled: 'Sin título',
        views: 'vistas',
        loadMore: 'Cargar más',
        sort: {
            dateDesc: 'Más recientes',
            dateAsc: 'Más antiguos',
            viewsDesc: 'Más vistos',
            viewsAsc: 'Menos vistos',
        },
        toasts: {
            updated: 'Clips actualizados',
            errorLoad: 'Error al cargar clips',
            copied: 'Enlace copiado',
            copyError: 'Error al copiar',
        },
        overlay: {
            close: 'Cerrar',
            openTwitch: 'Abrir en Twitch',
            errorInfo: 'Error al cargar',
            player: 'Reproductor de Clip',
            defaultTitle: 'Clip',
        }
    },
    commands: {
        config: {
            follow: {
                title: 'Comando !followage',
                desc: 'Muestra cuánto tiempo lleva alguien siguiéndote',
                info: 'Genera el código para que tu bot responda con el tiempo exacto que un usuario te sigue.',
                templatePlaceholder: 'Ej: {user} lleva sufriendo {time}.',
                templateVars: 'Variables disponibles: {user}, {time}, {channel}',
            },
            clip: {
                title: 'Comando !clip',
                desc: 'Permite crear clips desde el chat',
                info: 'Tus moderadores podrán crear clips instantáneos escribiendo !clip. Requiere estar en vivo. Wizebot y Fossabot ya incluyen !clip nativo, no hace falta integrar la API.',
                templatePlaceholder: 'Ej: ¡Miren este clip de {user}! 👉 {url}',
                templateVars: 'Variables disponibles: {user}, {url}',
            },
            shoutout: {
                title: 'Comando !so',
                desc: 'Promociona a otro streamer',
                info: 'Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.',
                templatePlaceholder: 'Ej: Dale follow a {user}, jugando {game} 👉 {url}',
                templateVars: 'Variables disponibles: {user}, {game}, {url}',
            },
            magic8: {
                title: 'Comando !8ball',
                desc: 'Comando para que tus viewers pregunten a la IA',
                info: 'Genera el código para añadir el comando de la Bola 8 a tu bot de chat.',
                extraSelectors: {
                    mood: {
                        label: 'Personalidad',
                        options: {
                            classic: 'Clásica',
                            sarcastic: 'Sarcástica',
                            toxic: 'Tóxica',
                            helpful: 'Servicial'
                        }
                    }
                }
            },
            russian: {
                title: 'Comando !ruleta',
                desc: 'Juego de Ruleta Rusa para el chat',
                info: 'Tus viewers podrán jugar a la Ruleta Rusa escribiendo !ruleta.',
                extraSelectors: {
                    hardcore: {
                        label: 'Modo Hardcore',
                        options: {
                            false: 'Desactivado',
                            true: 'Activado (60s timeout)'
                        }
                    }
                }
            },
            duel: {
                title: 'Comando !duelo',
                desc: 'Duelo 1vs1 narrado (Nightbot: 3 mensajes)',
                info: 'Con Nightbot el bot cuenta el duelo en 3 mensajes. En otros bots sale en una sola línea.',
            },
            slots: {
                title: 'Comando !slots',
                desc: 'Tragamonedas para el chat',
                info: 'Con Nightbot los carretes salen en 3 mensajes. En otros bots, solo el resultado final.',
            }
        },
        generator: {
            variables: 'Variables disponibles:',
            botSelect: 'Seleccionar Bot',
            langSelect: 'Idioma de respuesta del bot',
            langOptions: {
                es: 'Español',
                en: 'English',
                pt: 'Português',
            },
            customMsg: 'Mensaje Personalizado',
            copyFormat: 'Formato de Copia',
            formatFull: 'Comando Completo',
            formatUrl: 'Solo URL',
            ariaGenerated: 'Comando generado',
            btnCopied: 'Copiado!',
            btnCopy: 'Copiar',
            toasts: {
                noCommand: 'No se pudo generar',
                copied: 'Comando copiado',
                copyError: 'Error al copiar',
                apiError: 'Error de conexión',
            },
        },
        views: {
            errors: {
                missingFields: 'Faltan campos obligatorios',
            },
            followage: {
                testTitle: 'Probar Followage',
                testDesc: 'Verifica cuánto tiempo lleva alguien siguiendo',
                testTooltip: 'Herramienta de prueba',
                channelLabel: 'Canal',
                channelPlaceholder: 'Canal',
                userLabel: 'Usuario',
                userPlaceholder: 'Usuario',
            },
            watchtime: {
                testTitle: 'Probar Watchtime',
                testDesc: 'Verifica cuánto tiempo lleva alguien viendo el canal',
                testTooltip: 'Herramienta de prueba',
                channelLabel: 'Canal',
                channelPlaceholder: 'Canal',
                userLabel: 'Usuario',
                userPlaceholder: 'Usuario',
                disclaimerTitle: 'Requiere StreamElements',
                disclaimerWhat: '¿Qué es el watchtime?',
                disclaimerSubtitle: '¿Cómo funciona el watchtime?',
                disclaimerText: 'Este comando obtiene el tiempo que lleva un usuario viendo tu canal usando la API pública de StreamElements. No utiliza datos propios de Twitch.',
                disclaimerStep1: '⚠️ Solo funciona si el canal tiene activado el sistema de Lealtad/Puntos en StreamElements (streamelements.com). Si el canal no está registrado ahí, el comando devolverá un error.',
                disclaimerStep2: '💡 Para activarlo, el streamer debe ir a StreamElements › Loyalty y habilitar el sistema de puntos. Una vez activo, el bot empieza a registrar el tiempo automáticamente.',
            },
            shoutout: {
                testTitle: 'Probar Shoutout',
                testDesc: 'Lanza un shoutout a otro canal',
                testTooltip: 'Herramienta de prueba',
                channelLabel: 'Canal origen',
                channelPlaceholder: 'Tu canal',
                userLabel: 'Canal destino',
                userPlaceholder: 'Usuario a promocionar',
            },
        },
        apiTest: {
            btnTest: 'Probar',
            btnTesting: 'Probando...',
        },
    },
    feedback: {
        hintAnonymous: 'El mensaje será anónimo',
        hintDiscord: (username: string): string => `Serás contactado vía Discord (${username})`,
        hintTwitch: (username: string): string => `Serás contactado vía Twitch (${username})`,
        errorEmpty: 'El mensaje no puede estar vacío',
        successSend: 'Mensaje enviado con éxito',
        errorSend: 'Error al enviar el mensaje',
        errorGeneric: 'Ocurrió un error inesperado',
        title: 'Enviar Feedback',
        desc: 'Ayúdanos a mejorar',
        infoTooltip: 'Envía sugerencias o reporta errores',
        messageLabel: 'Mensaje',
        messagePlaceholder: 'Escribe tu mensaje aquí...',
        anonymousTitle: 'Enviar de forma anónima',
        anonymousOn: 'Activado (Anónimo)',
        anonymousOff: 'Desactivado (Público)',
        sendAs: 'Enviar como',
        linkDiscordText: 'Únete a nuestro ',
        linkDiscordBold: 'Discord',
        linkDiscordEnd: ' para asistencia rápida.',
        footerText: 'Gracias por tu feedback.',
        btnSending: 'Enviando...',
        btnSend: 'Enviar Mensaje',
    },
    minigames: {
        magic8: {
            title: 'Bola 8 Mágica',
            desc: 'Respuestas aleatorias a tus preguntas',
            info: 'Minijuego de chat',
            testDesc: 'Prueba la Bola 8',
            testInfo: 'Envía una pregunta de prueba',
            questionLabel: 'Pregunta',
            questionPlaceholder: '¿Ganaré la partida?',
            btnLoading: 'Preguntando...',
            btnAsk: 'Preguntar',
            loadingResult: 'Esperando respuesta...',
            errorEmpty: 'La pregunta no puede estar vacía',
            testTitle: 'Probar Bola 8',
        },
        duel: {
            title: 'Duelo',
            desc: 'Enfrentamiento entre viewers',
            info: 'Minijuego de chat',
            errorEmptyTarget: 'Debes especificar un objetivo',
            errorInvalidLogin: 'Usuario inválido',
            testTitle: 'Probar Duelo',
            testDesc: 'Inicia un duelo de prueba',
            testInfo: 'Simula un duelo en el chat',
            targetLabel: 'Objetivo',
            targetPlaceholder: 'Ej: Juan',
            challengerLabel: 'Retador',
            challengerPlaceholder: 'Ej: Pedro',
            btnLoading: 'Peleando...',
            btnFight: 'Pelear',
            loadingResult: 'Esperando resultado...',
        },
        russian: {
            title: 'Ruleta Rusa',
            desc: 'Juego de riesgo para el chat',
            info: 'Minijuego de chat',
            errorUnknown: 'Error desconocido',
            errorJammed: 'El arma se encasquilló',
            testTitle: 'Probar Ruleta Rusa',
            testDesc: 'Inicia el juego de prueba',
            btnTrigger: 'Apretar el gatillo',
            loadingResult: 'Esperando...',
        },
        slots: {
            title: 'Slots',
            desc: 'Tragamonedas para el chat',
            info: 'Minijuego de chat',
            testTitle: 'Probar Slots',
            testDesc: 'Gira los carretes de prueba',
            testInfo: 'Simula una tirada en el chat',
            btnSpin: 'Girar',
            btnLoading: 'Girando...',
            loadingResult: 'Esperando resultado...',
        },
    },
    tools: {
        stalker: {
            toasts: {
                copied: 'Copiado al portapapeles',
                cleared: 'Lista limpiada',
                error: 'Error de conexión',
                started: 'Stalker activado',
                paused: 'Stalker pausado',
                errorLoad: 'Error al cargar',
                errorChat: 'Error en el chat',
                errorInfo: 'Error de información',
                reloaded: 'Recargado exitosamente',
            },
            title: 'Stalker Mode',
            info: 'Analiza el chat en tiempo real',
            searchPlaceholder: 'Buscar en los mensajes...',
            btnPause: 'Pausar',
            btnStart: 'Iniciar',
            btnReload: 'Limpiar',
            tooltip: 'Lista quién escribe en el chat en tiempo real',
            table: {
                user: 'Usuario',
                message: 'Mensaje',
                time: 'Hora',
                actions: 'Acciones',
                empty: 'Sin datos',
                avatar: 'Avatar',
                login: 'Login',
                action: 'Acción',
                readyTitle: 'Listo para iniciar',
                readyDesc: 'El monitor está a la espera.',
                waiting: 'Esperando mensajes...',
                btnView: 'Ver en Twitch',
            },
            footer: 'Mostrando últimos mensajes',
        },
        trends: {
            countdown: (val: string): string => `Faltan ${val}`,
            remaining: 'restantes',
            title: (duration?: string): string => duration ? `Tendencias (${duration})` : 'Tendencias (Top Palabras)',
            status: {
                idle: 'Inactivo',
                active: 'Activo',
                finished: 'Finalizado',
                error: 'Error',
                connected: 'Conectado',
                connecting: 'Conectando...',
                synced: 'Sincronizado',
            },
            info: 'Mide las palabras más usadas',
            duration: 'Duración (minutos)',
            btnDecrease: '-',
            inputLabel: 'Minutos',
            min: 'min',
            btnIncrease: '+',
            startTimer: 'Iniciar Medición',
            reset: 'Reiniciar',
            tooltip: 'Mide el engagement del chat',
            table: {
                word: 'Palabra',
                count: 'Menciones',
                empty: 'No hay datos suficientes',
                reps: 'Repeticiones',
                readyTitle: 'Listo para iniciar',
                readyDesc: 'Selecciona el tiempo y comienza.',
                waiting: 'Esperando datos...',
                noData: 'No hay suficientes datos',
            },
        },
        roulette: {
            title: 'Ruleta de Sorteos',
            desc: 'Sorteos dinámicos en directo',
            info: 'Overlay interactivo',
            noParticipants: 'Sin participantes',
            pressPlay: 'Pulsa Girar para empezar',
            spinning: 'Girando...',
            winner: '¡Ganador!',
            participants: 'Participantes',
            notAnnounced: 'No anunciado',
            close: 'Cerrar',
            announceChatOn: 'Anunciar en chat (Activado)',
            announceChatOff: 'Anunciar en chat (Desactivado)',
            inChat: 'En el chat',
            pauseEntries: 'Pausar inscripciones',
            openEntries: 'Abrir inscripciones',
            listUpdated: 'Lista actualizada',
            reloadUsers: 'Recargar usuarios',
            infoTooltip: "Sortea un ganador del chat: entra todo el mundo o con una palabra, y filtra por roles",
            spinBtn: 'Girar Ruleta',
            twitchDelay: 'Retraso de Twitch ~3s',
            waitingChat: 'Esperando al chat...',
            waitingKeyword: "Esperando el comando en el chat...",
            keywordHint: "Entran con el comando elegido · Retraso Twitch ~3s",
            entryPresence: "Todos",
            entryKeyword: "Palabra",
            keywordLabel: "Comando",
            keywordPlaceholder: "sorteo",
            respin: "Re-sortear",
            historyTitle: "Ganadores recientes",
            historyClear: "Limpiar historial",
            whoCanPlay: 'Quién puede jugar',
            all: 'Todos',
            none: 'Nadie',
            roles: {
                subs: 'Suscriptores',
                mods: 'Mods',
                vips: 'VIPs',
                viewers: 'Viewers'
            }
        },
        questions: {
            title: 'Preguntas',
            description: 'Recoge preguntas del chat con un comando configurable.',
            keywordLabel: 'Comando',
            keywordPlaceholder: 'pregunta',
            status: {
                active: 'Escuchando',
                inactive: 'Pausado'
            },
            btnStart: 'Iniciar',
            btnStop: 'Detener',
            btnClear: 'Limpiar todo',
            btnClearDone: 'Limpiar respondidas',
            btnAnswer: 'Marcar respondida',
            btnSkip: 'Pasar',
            btnRemove: 'Quitar',
            listTitle: 'Bandeja',
            emptyList: 'Esperando preguntas del chat...',
            currentBadge: 'Actual',
            statusAnswered: 'Respondida',
            statusSkipped: 'Pasada',
            doneCount: 'archivadas',
            tooltip: 'Los viewers envían preguntas con el comando; tú las gestionas en el panel.',
            started: 'Escucha de preguntas activada',
            stopped: 'Escucha de preguntas pausada',
            missingFilter: 'Elige al menos un rol que pueda preguntar',
        },
    },
    overlay: {
        button: {
            title: 'Abrir guía del overlay',
            aria: 'Configurar overlay',
            label: 'Overlay'
        },
        setupModal: {
            titlePrefix: 'Overlay —',
            description: 'Sigue las instrucciones para conectar el overlay a tu software de streaming.',
            warning: 'La URL lleva tu token secreto.',
            warningBold: 'No la compartas públicamente.',
            generating: 'Generando enlace…',
            copying: 'Copiando…',
            copied: '¡Copiado al Portapapeles!',
            copySrc: 'Copiar URL de la Fuente',
            generateError: 'No se pudo generar la URL del overlay',
            copySuccess: 'URL del overlay copiada',
            copyError: 'No se pudo copiar la URL'
        },
        guide: {
            obsTitle: 'Configurar en OBS',
            obsSteps: {
                sourceTitle: 'Nueva fuente',
                sourceDetail: 'Fuentes → Navegador (Browser Source).',
                urlTitle: 'Pegar URL',
                urlDetail: 'Pega la URL que copiaste en el panel (botón Overlay).',
                sizeTitle: 'Tamaño',
                sizeDetail: (size: string): string => `${size}, fondo transparente.`,
                refreshTitle: 'Al activar escena',
                refreshDetail: 'Marca «Actualizar navegador cuando la escena se active».'
            },
            obsNote: 'Solo muestra en pantalla. Para iniciar, girar o reiniciar, usa el panel.',
            slTitle: 'Configurar en Streamlabs',
            slSteps: {
                sourceTitle: 'Nueva fuente',
                sourceDetail: 'Fuentes → Custom Widget o Browser Source.',
                urlTitle: 'Pegar URL',
                urlDetail: 'Pega la URL que copiaste en el panel (botón Overlay).',
                sizeTitle: 'Tamaño',
                sizeDetail: (size: string): string => `${size}, sin color de fondo.`,
                refreshTitle: 'Al mostrar escena',
                refreshDetail: 'Activa el refresco automático si tu plan lo permite.'
            },
            slNote: 'Si la fuente se ve negra, revisa el tamaño, el fondo transparente y el refresco al mostrar la escena.',
            tools: {
                trends: 'Tendencias',
                roulette: 'Ruleta'
            },
            sizes: {
                trends: '900 × 580 px (top 10; ancho de escena si prefieres)',
                roulette: '720 × 720 px'
            }
        },
        banners: {
            connecting: 'Conectando overlay…',
            waiting: 'Esperando datos del panel…'
        },
        gate: {
            invalidLink: 'Enlace de overlay inválido. Genera uno nuevo desde el panel.'
        },
        apps: {
            rouletteErrorTitle: 'Overlay de ruleta',
            trendsErrorTitle: 'Overlay de tendencias'
        }
    }
};

export type Translations = typeof es;
