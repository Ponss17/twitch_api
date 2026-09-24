/** Fragmento i18n: commands (es). */
export const commands = {
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
            insertVar: 'Insertar {var} en el mensaje',
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
            httpError: (status: number): string => `Error HTTP ${status}.`,
            docsErrors: 'Ver ayuda de errores',
            docsLimits: 'Ver límites de cuota',
        },
    }
};
