/** Fragmento i18n: commands (pt). */
export const commands = {
commands: {
        config: {
            follow: {
                title: 'Comando !followage',
                desc: 'Mostra há quanto tempo alguém te segue',
                info: 'Gera o código para seu bot responder com o tempo exato que um usuário te segue.',
                templatePlaceholder: 'Ex: {user} está sofrendo há {time}.',
                templateVars: 'Variáveis disponíveis: {user}, {time}, {channel}',
            },
            watchtime: {
                title: 'Comando !watchtime',
                desc: 'Mostra há quanto tempo alguém assiste à transmissão',
                info: 'Gera o código para seu bot responder com o tempo exato que um espectador está no canal.',
                templatePlaceholder: 'Ex: {user} está assistindo há {time}.',
                templateVars: 'Variáveis disponíveis: {user}, {time}, {channel}',
            },
            clip: {
                title: 'Comando !clip',
                desc: 'Permite criar clips pelo chat',
                info: 'Seus mods podem criar clips instantâneos digitando !clip. Requer estar ao vivo. Wizebot e Fossabot já incluem um !clip nativo, sem necessidade de integrar a API.',
                templatePlaceholder: 'Ex: Olha esse clip de {user}! 👉 {url}',
                templateVars: 'Variáveis disponíveis: {user}, {url}',
            },
            shoutout: {
                title: 'Comando !so',
                desc: 'Dê um shoutout para outro streamer',
                info: 'Gera um link para seu bot fazer um Shoutout com o jogo e link do canal.',
                templatePlaceholder: 'Ex: Vai lá seguir {user}, jogando {game} 👉 {url}',
                templateVars: 'Variáveis disponíveis: {user}, {game}, {url}',
            },
            magic8: {
                title: 'Comando !8ball',
                desc: 'Comando para seus espectadores perguntarem à IA',
                info: 'Gera o código para adicionar o comando Bola 8 Mágica ao seu bot de chat.',
                extraSelectors: {
                    mood: {
                        label: 'Personalidade',
                        options: {
                            classic: 'Clássica',
                            sarcastic: 'Sarcástica',
                            toxic: 'Tóxica',
                            helpful: 'Prestativa'
                        }
                    }
                }
            },
            russian: {
                title: 'Comando !roulette',
                desc: 'Jogo de Roleta Russa para o chat',
                info: 'Seus espectadores podem jogar Roleta Russa digitando !roulette.',
                extraSelectors: {
                    hardcore: {
                        label: 'Modo Hardcore',
                        options: {
                            false: 'Desativado',
                            true: 'Ativado (timeout de 60s)'
                        }
                    }
                }
            },
            duel: {
                title: 'Comando !duel',
                desc: 'Duelo 1vs1 narrado (Nightbot: 3 mensagens)',
                info: 'Com Nightbot o bot narra o duelo em 3 mensagens. Em outros bots aparece em uma única linha.',
            },
            slots: {
                title: 'Comando !slots',
                desc: 'Caça-níqueis para o chat',
                info: 'No Nightbot os rolos saem em 3 mensagens. Em outros bots, só o resultado final.',
            }
        },
        generator: {
            variables: 'Variáveis disponíveis:',
            insertVar: 'Inserir {var} na mensagem',
            botSelect: 'Selecionar Bot',
            langSelect: 'Idioma de resposta do bot',
            langOptions: {
                es: 'Español',
                en: 'English',
                pt: 'Português',
            },
            customMsg: 'Mensagem Personalizada',
            copyFormat: 'Copiar Formato',
            formatFull: 'Comando Completo',
            formatUrl: 'Apenas URL',
            ariaGenerated: 'Comando gerado',
            btnCopied: 'Copiado!',
            btnCopy: 'Copiar',
            toasts: {
                noCommand: 'Não foi possível gerar',
                copied: 'Comando copiado',
                copyError: 'Erro ao copiar',
                apiError: 'Erro de conexão',
            },
        },
        views: {
            errors: {
                missingFields: 'Campos obrigatórios ausentes',
            },
            followage: {
                testTitle: 'Testar Followage',
                testDesc: 'Verifique há quanto tempo alguém te segue',
                testTooltip: 'Ferramenta de teste',
                channelLabel: 'Canal',
                channelPlaceholder: 'Canal',
                userLabel: 'Usuário',
                userPlaceholder: 'Usuário',
            },
            watchtime: {
                testTitle: 'Testar Watchtime',
                testDesc: 'Verifique há quanto tempo alguém assiste ao canal',
                testTooltip: 'Ferramenta de teste',
                channelLabel: 'Canal',
                channelPlaceholder: 'Canal',
                userLabel: 'Usuário',
                userPlaceholder: 'Usuário',
                disclaimerTitle: 'Requer StreamElements',
                disclaimerWhat: 'O que é o watchtime?',
                disclaimerSubtitle: 'Como funciona o watchtime?',
                disclaimerText: 'Este comando obtém o tempo que um usuário está assistindo ao seu canal usando a API pública do StreamElements. Não utiliza dados nativos da Twitch.',
                disclaimerStep1: '⚠️ Só funciona se o canal tiver o sistema de Lealdade/Pontos ativado no StreamElements (streamelements.com). Se o canal não estiver registrado lá, o comando retornará um erro.',
                disclaimerStep2: '💡 Para ativar, o streamer deve ir ao StreamElements › Loyalty e habilitar o sistema de pontos. Uma vez ativo, o bot começa a registrar o tempo automaticamente.',
            },
            shoutout: {
                testTitle: 'Testar Shoutout',
                testDesc: 'Dê um shoutout para outro canal',
                testTooltip: 'Ferramenta de teste',
                channelLabel: 'Canal de origem',
                channelPlaceholder: 'Seu canal',
                userLabel: 'Canal alvo',
                userPlaceholder: 'Usuário para o shoutout',
            },
        },
        apiTest: {
            btnTest: 'Testar',
            btnTesting: 'Testando...',
            httpError: (status: number): string => `Erro HTTP ${status}.`,
            docsErrors: 'Ver ajuda de erros',
            docsLimits: 'Ver limites de cota',
        },
    }
};
