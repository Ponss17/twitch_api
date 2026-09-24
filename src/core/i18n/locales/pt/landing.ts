/** Fragmento i18n: landing (pt). */
export const landing = {
landing: {
        nav: {
            sectionsAria: 'Seções',
            product: 'Produto',
            docs: 'Docs',
            discord: 'Discord'
        },
        cta: {
            start: 'Começar',
            reconnect: 'Reconectar com a Twitch',
            panelShort: 'Painel',
            goToPanel: 'Ir ao Painel',
            panelAria: 'Painel de controle'
        },
        resources: {
            docsTitle: 'Documentação oficial',
            docsText:
                'Guias passo a passo, variáveis de comandos e tutoriais detalhados para configurar seu painel e integrações em minutos.',
            docsCta: 'Ler a Docs',
            discordTitle: 'Comunidade no Discord',
            discordText:
                'Entre no nosso servidor. Tire dúvidas em tempo real, sugira funções e conheça outros criadores como você.',
            discordCta: 'Entrar no servidor'
        },
        features: {
            stepsTitle: 'Comece com um comando',
            stepsSubtitle: 'Fácil em 3 passos. Tudo pelo navegador.',
            panelTitle: 'Tudo em um painel',
            panelSubtitle: 'Comandos, overlays e minijogos. Sem outro programa.',
            steps: {
                connect: {
                    title: 'Conecte a Twitch',
                    text: 'Entre com sua conta de streamer. Tudo funciona no navegador, sem instalar programas extras.'
                },
                generate: {
                    title: 'Gere o comando',
                    text: 'Escolha followage, watchtime, clips ou shoutout. O painel monta o comando com sua API key, pronto para copiar.'
                },
                bots: {
                    title: 'Cole no seu bot',
                    text: 'Nightbot, StreamElements ou Streamlabs. Cole como comando custom e o chat já pode usar.'
                }
            },
            panels: {
                commands: {
                    title: 'Comandos',
                    text: 'Followage, watchtime, clips e shoutouts. O chat pergunta e o bot responde com o texto da API.',
                    items: ['!followage', '!watchtime', '!clip', '!so']
                },
                tools: {
                    title: 'Ferramentas',
                    text: 'Tendências, stalker, roleta e perguntas. Várias têm overlay: a URL vai para o OBS como fonte de navegador.',
                    items: ['Tendências', 'Roleta', 'Perguntas', 'Stalker']
                },
                minigames: {
                    title: 'Minijogos',
                    text: 'Bola 8, roleta russa, duelos e slots. O chat joga sozinho; você não sai da live.',
                    items: ['!8ball', '!roleta', '!duelo', '!slots']
                }
            }
        },
        hero: {
            headlineLine1: 'Comandos para sua',
            headlineLine2: 'Live.',
            subtitle: 'Comandos, overlays e minijogos. Cole no Nightbot, StreamElements, Streamlabs ou OBS.',
            legacyNotice: 'Sua sessão anterior não é mais válida. Conecte novamente com a Twitch.',
            seePanel: 'Ver o painel',
            disclaimerBefore: 'Ao conectar você aceita a',
            privacy: 'política de privacidade',
            disclaimerAnd: 'e os',
            terms: 'termos de uso',
            disclaimerAfter: '.',
            tablistAria: 'O painel',
            tabs: {
                inicio: {
                    label: 'Painel',
                    text: 'O painel da LosPerrisAPI: comandos, overlays e minijogos em um só lugar.'
                },
                comandos: {
                    label: 'Comandos',
                    text: 'O gerador monta o comando para Nightbot, StreamElements ou Streamlabs.'
                },
                herramientas: {
                    label: 'Ferramentas',
                    text: 'Overlays no OBS e utilitários do painel, sem outro programa.'
                },
                minijuegos: {
                    label: 'Minijogos',
                    text: 'O chat joga sozinho. Você segue na live.'
                }
            }
        },
        fit: {
            title: 'Só copia e cola',
            subtitle: 'Sem instalar outro bot. O comando ou a URL vão para Nightbot, StreamElements, Streamlabs ou OBS.',
            chatTitle: 'Chat da live',
            welcome: 'Bem-vindo à sala de chat de ponss17!',
            hello: 'eae',
            sendPlaceholder: 'Enviar uma mensagem',
            demoTabsAria: 'Testar comando',
            moderator: 'Moderador',
            streamer: 'Streamer',
            points: {
                free: {
                    title: '100% Grátis',
                    text: 'O painel é totalmente grátis e sem custos ocultos.'
                },
                browser: {
                    title: 'Sem instalar',
                    text: 'Tudo roda no navegador. Sem exe nem extensão.'
                },
                bots: {
                    title: 'Sem outro bot',
                    text: 'Continue com Nightbot, StreamElements ou Streamlabs.'
                }
            },
            demos: {
                followage: {
                    label: 'Followage',
                    reply: 'mynana17 segue ponss17 há 2 anos e 3 meses.'
                },
                watchtime: {
                    label: 'Watchtime',
                    reply: 'mynana17 leva 2 anos e 3 meses assistindo ponss17.'
                },
                '8ball': {
                    label: '8ball',
                    reply: 'Os astros se alinham a seu favor, @mynana17... mas suas decisões futuras me preocupam. SIM.'
                },
                so: {
                    label: 'Shoutout',
                    reply: 'Vão seguir mynana17! Estava jogando Just Chatting'
                }
            }
        },
        faq: {
            title: 'Perguntas frequentes',
            subtitle: 'Grátis, bots e OBS. O que perguntam antes de conectar.',
            items: {
                gratis: {
                    title: 'É grátis?',
                    content: 'Sim. A LosPerrisAPI é totalmente grátis. Você pode usar todas as funções do painel sem custo.'
                },
                bots: {
                    title: 'Com quais bots funciona?',
                    content: 'Nightbot, StreamElements e Streamlabs. Copie o comando gerado no painel e cole no seu bot.'
                },
                empezar: {
                    title: 'Como começo?',
                    content: 'Conecte a Twitch, escolha o comando ou overlay e cole no bot ou no OBS. Em cerca de um minuto está pronto.'
                },
                permisos: {
                    title: 'Quais permissões a Twitch pede?',
                    content: 'Só as necessárias para identificar seu canal e gerar os comandos. Não publicamos no chat nem alteramos a live.'
                },
                obs: {
                    title: 'Posso usar no OBS?',
                    content: 'Sim. Tendências, roleta, perguntas e outras ferramentas têm overlay: copie a URL e cole como fonte de navegador.'
                }
            }
        },
        users: {
            title: 'Streamers que usam a API',
            subtitle: 'Junte-se aos streamers que já confiam na API nas lives.',
            noDescription: 'Sem descrição na Twitch.',
            loadingAria: 'Carregando pioneiros',
            twitchChannelAria: (name: string): string => `Canal da Twitch de ${name}`
        }
    }
};
