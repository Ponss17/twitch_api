/** Fragmento i18n: home (pt). */
export const home = {
home: {
        title: 'Início',
        tabs: {
            home: 'Início',
            analytics: 'Análises',
            settings: 'Configurações',
        },
        welcome: 'Bem-vindo',
        quickStats: 'Estatísticas Rápidas',
        recentActivity: 'Atividade Recente',
        noActivity: 'Nenhuma atividade recente.',
        requests: 'requisições',
        successRate: 'taxa de sucesso',
        avgLatency: 'latência média',
        today: 'hoje',
        broadcaster: {
            partner: 'Parceiro',
            affiliate: 'Afiliado',
            streamer: 'Streamer'
        },
        resources: {
            title: 'Recursos',
            commands: 'Mais usados',
            links: 'Links úteis',
            about: 'Sobre a API',
            docs: 'Documentação',
            status: 'Status do Sistema'
        },
        activityFeed: {
            title: 'Histórico de Atividade',
            subtitle: 'Filtre por categoria ou recurso em tempo real •',
            syncing: 'Sincronizando...',
            liveBadge: 'AO VIVO',
            liveTooltip: 'Filtre por categoria ou recurso. Novos eventos chegam ao vivo.',
            emptyFiltered: 'Sem resultados',
            emptyAll: 'Sem atividade recente',
            emptyFilteredDesc: 'Tente outro filtro ou volte para Todos.',
            emptyAllDesc: 'Quando alguém usar um comando no seu chat, aparecerá aqui.',
            emptyWithOnboarding: 'O histórico se preenche sozinho',
            emptyWithOnboardingDesc: 'Enquanto isso, configure um comando acima.',
            all: 'Todos'
        },
        onboarding: {
            welcomeTitle: 'Bem-vindo ao LosPerrisAPI',
            welcomeBody: 'Deixa eu te mostrar as principais funcionalidades em um tour rápido para você começar logo.',
            start: 'Começar',
            skip: 'Pular',
            back: 'Voltar',
            next: 'Próximo',
            finish: 'Terminar',
            stepOf: 'Passo {step} de {total}',
            doneTitle: 'Você está pronto!',
            doneBody: 'Obrigado por fazer o tour. Aproveite o painel e explore cada seção no seu ritmo.',
            doneBtn: 'Começar a usar',
            steps: {
                'sidebar-nav': {
                    title: 'Menu de navegação',
                    body: 'Alterne entre todas as seções: Início, Análises, Relatórios, Comandos, Ferramentas e Minijogos. No desktop você pode recolher a barra para ganhar espaço.'
                },
                'home-hero': {
                    title: 'Resumo do canal',
                    body: 'Seguidores totais, tipo de canal e data de início. Este cartão é atualizado com seus dados reais do Twitch sempre que você entra.'
                },
                'home-activity': {
                    title: 'Atividade em tempo real',
                    body: 'Cada vez que alguém usar um comando no seu chat aparece aqui instantaneamente via WebSocket. Filtre por categoria ou clique em qualquer entrada para ver os detalhes.'
                },
                'home-resources': {
                    title: 'Atalhos rápidos',
                    body: 'Os 3 comandos que você mais usa nesta semana, links para a API e para a documentação. Atualiza automaticamente conforme sua atividade.'
                },
                analytics: {
                    title: 'Análises do canal',
                    body: 'Gráficos de uso por dia, semana ou mês. Compare quais comandos e ferramentas são mais populares na sua comunidade.'
                },
                followage: {
                    title: 'Gerador de comandos',
                    body: 'Copie a URL pronta para Nightbot, StreamElements ou qualquer bot. Escolha o formato, o idioma e teste a resposta diretamente aqui.'
                }
            }
        },
        activityLog: {
            categories: {
                all: 'Todos',
                commands: 'Comandos',
                tools: 'Ferramentas',
                minigames: 'Minijogos'
            },
            relativeTime: {
                now: 'agora',
                minutes: (mins: number): string => `${mins} min atrás`,
                hours: (hours: number): string => `${hours} h atrás`
            },
            date: {
                today: 'Hoje',
                yesterday: 'Ontem'
            },
            types: {
                clip: { label: 'Clip', defaultDetail: 'Novo clip' },
                followage: { label: 'Followage', defaultDetail: 'Consulta de followage', channel: (target: string): string => `Canal: ${target}` },
                watchtime: { label: 'Watchtime', defaultDetail: 'Consulta de watchtime', channel: (target: string): string => `Canal: ${target}` },
                shoutout: { label: 'Shoutout', defaultDetail: 'Shoutout enviado', to: (target: string): string => `Para: ${target}` },
                message: { label: 'Mensagem', defaultDetail: 'Mensagem no chat' },
                russian: { label: 'Roleta Russa', defaultDetail: 'Jogo de roleta russa', channel: (target: string): string => `Canal: ${target}` },
                magic8: { label: 'Bola 8 Mágica', defaultDetail: 'Pergunta da bola 8 mágica' },
                duel: { label: 'Duelo', defaultDetail: 'Duelo iniciado', vs: (target: string): string => `vs @${target}` },
                slots: { label: 'Slots', defaultDetail: 'Jogada de slots' },
                stalker: { label: 'Stalker', defaultDetail: 'Varredura de stalker' },
                trends: { label: 'Tendências', defaultDetail: 'Rastreamento de tendências' },
                roulette: { label: 'Roleta', defaultDetail: 'Roleta de espectadores' },
                other: { label: 'Atividade', defaultDetail: 'Evento registrado' }
            }
        },
        activityInspector: {
            title: 'Inspetor de Eventos',
            date: 'Data',
            time: 'Hora',
            user: 'Usuário',
            summary: 'Resumo',
            technicalMetadata: 'Metadados Técnicos',
            copy: 'Copiar',
            unknownDate: 'Desconhecido',
            unknownTime: '---',
            emptyMetadata: 'Sem metadados adicionais',
            fieldType: 'Tipo',
            fieldTimestamp: 'Timestamp',
            fieldTarget: 'Alvo',
            fieldTitle: 'Título',
            fieldUrl: 'URL',
            fieldMessage: 'Mensagem',
            fieldQuestion: 'Pergunta',
            fieldResponse: 'Resposta',
            fieldSource: 'Origem',
            fieldAnnounce: 'Anúncio',
            fieldAction: 'Ação',
            fieldClipId: 'ID do clipe',
            fieldLatency: 'Latência',
            fieldLang: 'Idioma',
            fieldFormat: 'Formato',
            fieldMood: 'Mood',
            fieldHardcore: 'Hardcore',
            fieldRawDetail: 'Detalhe',
            rawJson: 'event.json'
        }
    }
};
