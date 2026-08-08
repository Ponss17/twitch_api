import type { Translations } from './es';

export const pt: Translations = {
    legal: {
        introTerms: 'Estes termos regulam o acesso e o uso do **LosPerrisBot**, disponível em [ttv.losperris.dev](https://ttv.losperris.dev). Ao usar o site, conectar sua conta Twitch (o app aparece como **LosPerris - API**) ou usar sua API Key, você concorda com estas condições e com a política de privacidade.',
        introPrivacy: 'Esta política descreve o tratamento de informações pessoais em [ttv.losperris.dev](https://ttv.losperris.dev) pelo **LosPerrisBot**. Ao conectar o Twitch, o app autorizado é identificado como **LosPerris - API**.',
        introCookies: 'Este documento complementa a política de privacidade e descreve o uso de armazenamento local e tecnologias similares no **LosPerrisBot**. Não usamos cookies de publicidade nem vendemos dados derivados da navegação.',
        sections: [
            {
                title: 'Descrição do Serviço',
                content: 'Oferecemos um painel interativo para Twitch que permite aos streamers interagir com seu público por meio de comandos, minijogos e um overlay na tela. Não armazenamos áudio, vídeo ou credenciais bancárias.'
            },
            {
                title: 'Obrigações do Usuário',
                content: 'Ao fazer login, você confirma que é o titular da conta Twitch ou está autorizado a usá-la. Você pode exportar ou excluir seus dados na aba Configurações do painel a qualquer momento.'
            },
            {
                title: 'Condutas Proibidas',
                content: 'É proibido usar o serviço para spam em massa, atividades ilegais ou qualquer ação que viole os Termos de Serviço da Twitch. Reservamo-nos o direito de revogar o acesso a contas que abusem dos limites da API.'
            },
            {
                title: 'Limitação de Responsabilidade',
                content: 'O serviço é fornecido "como está". Não garantimos disponibilidade de 100% nem nos responsabilizamos por danos diretos ou indiretos resultantes de interrupções, perda de dados ou alterações na API da Twitch.'
            },
            {
                title: 'Suspensão do Serviço',
                content: 'Podemos suspender temporariamente o acesso para manutenção ou caso detectemos tráfego anômalo que coloque a infraestrutura compartilhada em risco.'
            },
            {
                title: 'Modificações',
                content: 'Podemos modificar estes termos a qualquer momento. O uso continuado do serviço após as alterações constitui sua aceitação.'
            },
            {
                title: 'Quem gerencia os dados',
                content: 'Seus dados são tratados pelo LosPerrisBot, operando sob a infraestrutura descrita abaixo. Atuamos como intermediários entre sua conta Twitch e as funcionalidades do painel.'
            },
            {
                title: 'Dados que coletamos',
                content: 'Coletamos seu ID Twitch, login, status de afiliado e data de criação da conta para a autenticação principal. Armazenamos suas configurações personalizadas (comandos, minijogos) e um log temporário dos últimos 200 eventos no seu canal.'
            },
            {
                title: 'Dados que não coletamos',
                content: 'Não armazenamos senhas (usamos OAuth2). Não coletamos, lemos ou armazenamos mensagens do chat além das invocações de comandos específicos do bot. Não coletamos dados de pagamento ou endereço.'
            },
            {
                title: 'Uso dos Dados',
                content: 'Seus dados são usados exclusivamente para habilitar as funcionalidades do seu painel, processar suas configurações de minijogos e estatísticas. Não vendemos nem transferimos dados a terceiros para fins publicitários.'
            },
            {
                title: 'Provedores e terceiros',
                content: 'Compartilhamos dados mínimos estritamente necessários com nossos provedores de infraestrutura: Twitch (autenticação e consultas), Supabase (armazenamento de perfil), Vercel (hospedagem e métricas), Groq (processamento de texto na Bola 8 Mágica) e Discord (apenas se você enviar feedback voluntário).'
            },
            {
                title: 'Retenção de Dados',
                content: 'Perfis e configurações são mantidos enquanto a conta estiver ativa. Os logs de atividade do canal são truncados automaticamente para os 200 eventos mais recentes por usuário. Se você excluir sua conta, eles são apagados imediatamente do banco de dados principal.'
            },
            {
                title: 'Direitos do Usuário',
                content: 'Você tem o direito de saber quais dados temos, corrigir dados incorretos e exportar ou excluir sua conta na seção Configurações do painel a qualquer momento. A exclusão é permanente.'
            },
            {
                title: 'Cookies e armazenamento local',
                content: 'Usamos cookies de sessão criptografados e armazenamento local (localStorage/IndexedDB) estritamente necessários para manter sua sessão ativa, armazenar estatísticas em cache e persistir suas preferências do painel (modo escuro, idioma).'
            },
            {
                title: 'Menores',
                content: 'O serviço é destinado a usuários com mais de 13 anos (ou a idade mínima exigida pela Twitch em seu país). Não coletamos intencionalmente dados de menores abaixo dessa idade.'
            },
            {
                title: 'Segurança',
                content: 'Implementamos criptografia em trânsito (HTTPS) e em repouso via Supabase. Seu token de sessão tem validade curta e é renovado automaticamente. Nunca expomos tokens da API da Twitch ao cliente.'
            },
            {
                title: 'Atualizações',
                content: 'Esta política pode ser atualizada. A data da última revisão estará sempre visível no rodapé deste documento.'
            },
            {
                title: 'Armazenamento Local',
                content: 'O LocalStorage é usado para reter sua API Key, suas preferências do painel e acelerar o carregamento das páginas armazenando respostas temporárias em cache.'
            },
            {
                title: 'Service Worker',
                content: 'Podemos usar Service Workers para suportar notificações ou funcionalidades offline do painel, que residem no seu dispositivo local.'
            },
            {
                title: 'Métricas de Desempenho',
                content: 'Usamos o Vercel Web Vitals e Speed Insights de forma anônima para monitorar tempos de carregamento e identificar gargalos na plataforma.'
            },
            {
                title: 'Limpeza do armazenamento',
                content: 'Você pode limpar todo o armazenamento local fazendo logout, limpando os dados do site no seu navegador ou usando o botão de limpar estatísticas nas Configurações.'
            }
        ]
    },
    exporter: {
        home: 'Início',
        docs: 'Documentação',
        dashboard: 'Painel',
        reportBadge: 'Relatório da Conta',
        followers: 'Seguidores',
        today: 'Hoje',
        total: 'Total',
        success: 'Sucesso',
        profile: 'Perfil',
        accountInfo: 'Informações da Conta',
        name: 'Nome',
        login: 'Login',
        channelType: 'Tipo de Canal',
        memberSince: 'Membro desde',
        bio: 'Biografia',
        access: 'Acesso',
        securityAndApiKey: 'Segurança e API Key',
        status: 'Status',
        active: 'Ativo',
        limit: 'Limite',
        level: 'Nível',
        metrics: 'Métricas',
        apiPerformance: 'Desempenho da API',
        recentActivity: 'Atividade Recente',
        noRecentActivity: 'Nenhuma atividade recente para mostrar.',
        links: 'Links',
        legal: 'Legal',
        privacyPolicy: 'Política de Privacidade',
        terms: 'Termos',
        generatedOn: 'Gerado em',
        at: 'às'
    },
    verifying: {
        authenticated: 'AUTENTICADO',
        accessGranted: 'Acesso concedido. Redirecionando...',
        cacheActive: 'Cache local ativo — carregamento rápido.',
        noCache: 'Sincronizando perfil seguro...',
    },
    settings: {
        title: 'Configurações',
        tabs: {
            general: 'Geral',
            data: 'Dados',
            security: 'Segurança',
            connections: 'Conexões',
            sessionExpiredLogin: 'Sessão expirada. Faça login novamente.',
            overlayExpired: 'Link do overlay expirado. Gere um novo no seu painel.',
            unstableConnection: 'Conexão instável com a Twitch. Tentando novamente...'
        },
        account: {
            title: 'Conta',
            description: 'Seu identificador de plano e limites',
        },
        preferences: {
            title: 'Preferências',
            description: 'Configurações da conta',
            timezone: {
                label: 'Fuso Horário',
                description: 'Seu fuso horário é usado para agrupar e exibir corretamente os dias nas suas estatísticas e relatórios.',
                searchPlaceholder: 'Buscar fuso horário...',
                searchAriaLabel: 'Buscar fuso horário',
                noResults: 'Nenhum resultado encontrado',
                save: 'Salvar',
                saving: 'Salvando...',
            },
            language: {
                label: 'Idioma da Interface',
                description: 'Escolha o idioma em que o painel de controle é exibido.',
            },
            theme: {
                label: 'Tema da Interface',
                description: 'Escolha o esquema de cores da aplicação.',
                options: {
                    dark: 'Escuro',
                    light: 'Claro',
                    liga: 'Liga (LDA)',
                    minimal: 'Minimal',
                    matrix: 'Neo Matrix'
                }
            },
        },
        data: {
            title: 'Dados',
            description: 'Exporte as informações da sua conta',
        },
        toasts: {
            settingsSaved: 'Configurações salvas com sucesso.',
            settingsError: 'Erro ao salvar configurações.',
            networkError: 'Erro de rede ao salvar configurações.',
            invalidSession: 'Sessão inválida ou CSRF rejeitado. Por favor, recarregue a página.',
            regenError: 'Erro ao regenerar a API Key',
            regenSuccess: 'Nova API Key gerada',
            clearError: 'Erro de conexão ao limpar dados',
            clearSuccess: 'Estatísticas resetadas',
            deleteError: 'Erro de conexão ao excluir conta',
            deleteSuccess: 'Conta excluída. Redirecionando...',
            copyKeySuccess: 'API Key copiada',
            copyKeyError: 'Não foi possível copiar a API Key',
            copyIdSuccess: 'ID copiado',
            limitError: 'Erro de conexão ao verificar limite.',
            connectionError: 'Erro de conexão.',
            discordUnlinkError: 'Não foi possível desvincular o Discord',
            discordUnlinkSuccess: 'Discord desvinculado',
            profileError: 'Erro ao carregar perfil',
            discordLinkSuccess: 'Discord vinculado com sucesso',
            discordLinkTaken: 'Esse Discord já está vinculado a outra conta',
            discordLinkAuth: 'Você precisa fazer login para vincular o Discord',
            discordLinkConfig: 'A vinculação do Discord não está disponível agora',
            discordLinkError: 'Não foi possível vincular o Discord',
            exportLimitError: 'Você precisa aguardar antes de gerar outro relatório.'
        },
        dangerModals: {
            resetTitle: 'Resetar Estatísticas',
            resetDesc: 'Esta ação apagará todo o histórico de comandos, clips e dados de latência. Sua conta e API Key permanecerão ativas.',
            resetWord: 'LIMPAR',
            resetConfirm: 'Confirmar e Limpar',
            deleteTitle: 'Excluir Perfil LosPerris API',
            deleteDesc: 'ATENÇÃO! Esta ação é irreversível em nossa plataforma. Seus dados e API Key serão excluídos. Isso NÃO afetará seu canal ou conta Twitch de nenhuma forma.',
            deleteWord: 'EXCLUIR',
            deleteConfirm: 'Confirmar e Excluir'
        },
        hero: {
            hello: 'Olá,',
            welcome: 'Bem-vindo ao seu painel · atividade e atalhos rápidos',
            followers: 'Seguidores',
            channelType: 'Tipo de Canal',
            memberSince: 'Membro desde',
            notAvailable: 'Não disponível agora'
        },
        groups: {
            account: { title: 'Conta', desc: 'Seu identificador de plano e limites' },
            preferences: { title: 'Preferências', desc: 'Configurações da conta' },
            data: {
                title: 'Dados da Conta',
                desc: 'Informações e gerenciamento dos dados da sua conta.',
                firstLogin: 'Primeiro Login',
                firstLoginDesc: 'Data em que você fez login pela primeira vez.',
                lastLogin: 'Último Login Anterior',
                lastLoginDesc: 'Data da sua última sessão antes da atual.'
            },
            export: { title: 'Exportar', desc: 'Exporte as informações da sua conta' },
            security: { title: 'Segurança', desc: 'Chaves e acesso' },
            dangerZone: { title: 'Zona de Perigo', desc: 'Ações destrutivas' },
            discord: { title: 'Discord', desc: 'Integrações' }
        },
        panels: {
            userId: 'ID do Usuário',
            copyUserId: 'Copiar ID do Usuário',
            planAndQuota: 'Plano e cota',
            planTooltip: 'Seu plano de API: maior = mais cota e dados mais recentes',
            apiQuotaTooltip: 'Requisições por minuto com sua API Key (comandos e integrações)',
            heavyQuotaTooltip: 'Cota de endpoints pesados (clips / chatters) com API Key',
            cacheTooltip: 'Retenção do cache de comandos do bot (followage, etc.)',
            planTier: 'Plano',
            requestsLimit: 'Requisições / min',
            heavyLimit: 'Pesados / 10m',
            cacheTime: 'Cache (min)',
            apiKeyPrivate: 'API Key Privada',
            apiKeyInfo: 'Mantenha esta informação privada. Não a compartilhe durante a stream.',
            apiKeyWarning: 'Sua chave pessoal e intransferível. Use-a no Nightbot, StreamElements, etc.',
            activeKey: 'API Key Ativa',
            activeKeyDesc: 'Pronta para autenticar requisições (Bearer).',
            toggleVisibility: 'Mostrar/Ocultar',
            copyKey: 'Copiar',
            regenKey: 'Regenerar',
            dangerZoneTitle: 'Zona de Perigo',
            resetStats: 'Resetar Estatísticas',
            resetStatsDesc: 'Limpa o histórico de uso e análises. Não afeta sua conta.',
            deleteAccount: 'Excluir Conta',
            deleteAccountDesc: 'Exclui permanentemente todos os seus dados e faz logout.',
            discordTitle: 'Discord',
            discordStatus: (linked: boolean): string => (linked ? 'Conectado' : 'Não conectado'),
            linkDiscord: 'Vincular Discord',
            unlinkDiscord: 'Desvincular Discord',
            fullReport: 'Relatório Completo da Conta',
            exportReport: 'Exportar Dados',
            exportDesc: 'Baixe um arquivo JSON com seu histórico de atividades e configurações para conformidade com portabilidade de dados.'
        },
    },
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
            commands: 'Comandos rápidos',
            links: 'Links úteis',
            about: 'Sobre a API',
            docs: 'Documentação',
            status: 'Status do Sistema'
        },
        activityFeed: {
            title: 'Histórico de Atividade',
            subtitle: 'Filtre por categoria ou recurso em tempo real •',
            syncing: 'Sincronizando...',
            liveTooltip: 'Filtre por categoria ou recurso. Novos eventos chegam ao vivo.',
            emptyFiltered: 'Sem resultados',
            emptyAll: 'Sem atividade recente',
            emptyFilteredDesc: 'Tente outro filtro ou volte para Todos.',
            emptyAllDesc: 'Quando alguém usar um comando no seu chat, aparecerá aqui.',
            all: 'Todos'
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
                shoutout: { label: 'Shoutout', defaultDetail: 'Shoutout enviado', to: (target: string): string => `Para: ${target}` },
                message: { label: 'Mensagem', defaultDetail: 'Mensagem no chat' },
                russian: { label: 'Roleta Russa', defaultDetail: 'Jogo de roleta russa', channel: (target: string): string => `Canal: ${target}` },
                magic8: { label: 'Bola 8 Mágica', defaultDetail: 'Pergunta da bola 8 mágica' },
                duel: { label: 'Duelo', defaultDetail: 'Duelo iniciado', vs: (target: string): string => `vs @${target}` },
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
            unknownTime: '---'
        }
    },
    analytics: {
        other: 'Outros',
        kpis: {
            title: 'Desempenho Global',
            info: 'Métricas agregadas do seu uso da API.',
            today: 'Hoje',
            sevenDays: '7d',
            requests: 'Total de Requisições',
            successRate: 'Taxa de Sucesso',
            latency: 'Latência Média',
            commands: 'Comandos Usados',
            requestsToday: 'Requisições hoje',
            requests7d: 'Requisições em 7 dias',
            successToday: 'Sucesso hoje',
            success7d: 'Sucesso em 7 dias',
            latencyToday: 'Tempo de resposta hoje',
            latency7d: 'Tempo de resposta em 7 dias',
            commandsToday: 'Comandos únicos hoje',
            commands7d: 'Comandos únicos em 7 dias'
        },
        todayChart: {
            title: 'Atividade Hoje (por Hora)',
            info: 'Distribuição horária das requisições.',
            success: 'Sucessos',
            errors: 'Erros',
            successRate: 'Taxa de Sucesso',
            total: 'Total de Requisições',
            noData: 'Sem dados hoje',
            noDataSub: 'Use um comando'
        },
        latencyChart: {
            title: 'Desempenho e Latência',
            info: 'Tempo de resposta por comando.',
            noData: 'Sem latência',
            noDataSub: 'Aguardando dados',
            latency: 'Latência Média'
        },
        endpointsTable: {
            title: 'Comandos Mais Usados',
            info: 'Lista de comandos com requisições, taxa de sucesso e latência média.',
            noData: 'Dados insuficientes',
            noDataSub: 'Execute comandos no seu canal para gerar histórico',
            headers: {
                command: 'Comando',
                requests: 'Requisições',
                success: 'Sucesso',
                latency: 'Latência'
            }
        },
        distributionChart: {
            title: 'Distribuição de Comandos',
            info: 'Requisições por comando.',
            noData: 'Sem comandos',
            noDataSub: 'Inicie a atividade'
        },
        areaChart: {
            title: 'Tráfego e Erros (7 dias)',
            info: 'Histórico dos últimos 7 dias. Hoje atualiza em tempo real.',
            requests: 'Requisições',
            noData: 'Sem atividade',
            noDataSub: 'Aguardando eventos'
        },
        leaderboard: {
            title: 'Top Usuários',
            infoToday: 'Usuários mais ativos hoje.',
            info7d: 'Usuários mais ativos em 7 dias.',
            noData: 'Sem usuários',
            noDataSub: 'Aguardando interações',
            rankingToday: 'Top Hoje',
            ranking7d: 'Top 7 Dias',
            totalInteractions: 'interações',
            totalInteractionsTooltip: 'Total de usos por todos os espectadores',
            unitSingular: 'uso',
            unitPlural: 'usos'
        }
    },
    header: {
        subtitles: {
            home: 'Resumo da sua atividade recente',
            analytics: 'Estatísticas detalhadas da API',
            settings: 'Configurações da conta',
            followage: 'Verifique há quanto tempo alguém te segue',
            watchtime: 'Verifique há quanto tempo alguém assiste à transmissão',
            clips: 'Explore e gerencie seus clips da Twitch',
            shoutout: 'Promova outros streamers no seu canal',
            trends: 'Descubra as palavras mais usadas no seu chat',
            stalker: 'Monitore mensagens de usuários específicos',
            roulette: 'Sorteios rápidos e interativos',
            magic8: 'Respostas divertidas às perguntas do chat',
            russian: 'Minijogo de roleta russa para espectadores',
            duel: 'Batalhas 1vs1 entre espectadores',
            feedback: 'Envie sugestões ou reporte bugs',
            default: 'Painel'
        },
        closeMenu: 'Fechar menu',
        openMenu: 'Abrir menu',
        accountMenu: 'Menu da conta',
        myAccount: 'MINHA CONTA',
        settings: 'Configurações',
        twitchProfile: 'Perfil Twitch',
        supportProject: 'Apoiar o Projeto',
        logout: 'Sair'
    },
    sidebar: {
        categories: {
            general: 'Geral',
            commands: 'Comandos',
            tools: 'Ferramentas',
            minigames: 'Minijogos',
            support: 'Suporte'
        },
        items: {
            home: 'Início',
            analytics: 'Análises',
            followage: 'Followage',
            watchtime: 'Watchtime',
            clips: 'Clips',
            shoutout: 'Shoutout',
            trends: 'Tendências',
            stalker: 'Stalker',
            roulette: 'Roleta',
            magic8: 'Bola 8 Mágica',
            russian: 'Roleta Russa',
            duel: 'Duelo',
            feedback: 'Feedback',
            settings: 'Configurações'
        },
        docs: 'Documentação',
        discord: 'Comunidade',
        navigation: 'Navegação do Painel'
    },
    common: {
        channel: 'Canal',
        save: 'Salvar',
        saving: 'Salvando...',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        copy: 'Copiar',
        copied: 'Copiado',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        tabError: 'Erro ao carregar aba',
        aria: {
            close: 'Fechar',
            closePanel: 'Fechar painel',
            moreInfo: 'Mais informações',
            verifyingSession: 'Verificando sessão',
            streamingPlatform: 'Plataforma de streaming',
            feedbackIdentity: 'Identidade do feedback',
            legalSections: 'Seções legais',
            settingsSections: 'Seções de configurações',
            filterResource: 'Filtrar por recurso'
        }
    },
    modals: {
        danger: {
            typeToConfirm: (word: string): string => `Digite "${word}" para confirmar`,
            placeholder: 'Digite aqui...',
            processing: 'Processando...',
            cancel: 'Cancelar',
            defaultConfirm: 'Confirmar e Excluir',
        },
        regenKey: {
            title: 'Regenerar API Key',
            prefixWarning: 'Ao regenerar, ',
            warning: 'a chave anterior deixará de funcionar',
            desc1: 'Isso significa que:',
            point1: 'Você precisará atualizar todos os seus bots e ferramentas.',
            point2: 'Você não poderá recuperar a chave anterior.',
            disclaimer: 'Esta ação não pode ser desfeita.',
            confirm: 'Regenerar',
            regenerating: 'Regenerando...',
            cancel: 'Cancelar',
        },
        postRegenKey: {
            title: 'Nova API Key',
            desc1: 'Por favor, copie sua nova chave:',
            point1: 'Guarde-a em um lugar seguro.',
            point2: 'Não a compartilhe com ninguém.',
            disclaimer: 'Se você a perder, precisará gerar outra.',
            copy: 'Copiar para a área de transferência',
            copied: 'Copiado!',
        },
        discordLink: {
            title: 'Vincular Discord',
            continue: 'Continuar',
            desc1: 'Você está prestes a vincular sua conta Discord.',
            desc2: 'Ao fazer isso:',
            point1: 'Você poderá usar comandos pelo Discord.',
            point2: 'Sua conta ficará mais segura.',
            point3: 'Você receberá notificações importantes.',
            disclaimer: 'Você pode desvincular a qualquer momento.',
        },
        discordUnlink: {
            title: 'Desvincular Discord',
            unlinking: 'Desvinculando...',
            confirm: 'Desvincular',
            descUsername: (username: string): string => `Você está prestes a desvincular a conta: ${username}`,
            descNoUsername: 'Você está prestes a desvincular sua conta Discord.',
            desc2: 'Ao fazer isso:',
            point1: 'Você não poderá mais usar comandos pelo Discord.',
            point2: 'Seus dados do Discord serão excluídos.',
            point3: 'Você deixará de receber notificações.',
            disclaimer: 'Você pode vincular novamente mais tarde.',
        },
        discordResult: {
            close: 'Fechar',
            gotIt: 'Entendi',
            linked: {
                title: 'Discord Vinculado',
                lead: 'Sua conta foi vinculada.',
                points: ['Agora você pode usar comandos.', 'Sua conta está protegida.'],
                hint: 'Obrigado por usar a LosPerris API!',
            },
            unlinked: {
                title: 'Discord Desvinculado',
                lead: 'Sua conta foi desvinculada.',
                points: ['Seus dados foram excluídos.', 'Você não receberá mais notificações.'],
            },
            errorTaken: {
                title: 'Erro de Vinculação',
                lead: 'Esta conta já está em uso.',
                points: ['Tente com outra conta.', 'Entre em contato com o suporte se achar que é um erro.'],
            },
            errorAuth: {
                title: 'Erro de Autenticação',
                lead: 'Não conseguimos verificar sua conta.',
                points: ['Tente novamente.', 'Certifique-se de estar logado.'],
            },
            errorConfig: {
                title: 'Erro de Configuração',
                lead: 'Há um problema com a configuração.',
                points: ['Entre em contato com o suporte.', 'Tente novamente mais tarde.'],
            },
            error: {
                title: 'Erro Desconhecido',
                lead: 'Algo deu errado.',
                points: ['Tente novamente.', 'Se o problema persistir, entre em contato.'],
            },
        },
        userInspect: {
            close: 'Fechar',
            rank: 'Ranking',
            userId: 'ID do Usuário',
            copyId: 'Copiar ID',
            copied: 'Copiado',
            accountAge: 'Idade da Conta',
            noBio: 'Sem biografia.',
            chatHistory: 'Histórico do Chat',
            noMessages: 'Nenhuma mensagem registrada nesta sessão.',
            accountCreated: (date: string): string => `Conta criada: ${date}`,
            viewHistory: 'Ver histórico do chat'
        },
        login: {
            cancel: 'Cancelar',
            title: 'Autorização Necessária',
            validating: 'Conectando...',
            accept: 'Conectar com a Twitch',
            desc1: 'Para acessar o Painel, você precisa vincular seu canal ',
            desc1Bold: 'Twitch',
            desc1End: '.',
            desc2: 'Ao continuar, você autoriza o LosPerris a:',
            point1: 'Ler as informações públicas do seu canal.',
            point2: 'Visualizar e gerenciar análises de streaming em tempo real.',
            point3: 'Sincronizar e gerenciar os comandos do seu chat.',
            disclaimer: 'A conexão é completamente segura via Twitch OAuth. Não temos acesso nem armazenamos sua senha. Você pode revogar essas permissões a qualquer momento nas configurações de conexões da sua conta Twitch.',
            privacyLink: 'Política de Privacidade',
            termsLink: 'Termos de Serviço'
        },
    },
    globals: {
        loading: {
            dashboard: 'Carregando painel',
            panel: 'Carregando painel',
            profile: 'Carregando perfil',
            clips: 'Carregando clips',
            analytics: 'Carregando análises',
            commands: 'Carregando comandos',
            trends: 'Carregando tendências',
            stalker: 'Carregando stalker',
            settings: 'Carregando configurações',
            starting: 'Iniciando...'
        },
        toasts: {
            offline: 'Conexão perdida. Tentando reconectar...',
            online: 'Conexão restaurada com a Twitch.',
            sessionExpiredLogin: 'Sessão expirada. Faça login novamente.',
            unstableConnection: 'Conexão instável com a Twitch. Tentando novamente...',
            rouletteLoadError: 'Erro ao carregar dados da roleta.',
            rouletteChatError: 'Erro ao conectar ao chat.',
            rouletteSendError: 'Erro ao enviar mensagem.',
            rouletteWinner: (username: string, count: number): string => `Vencedor: ${username} (${count} entradas)!`,
            rouletteInscriptionsClosed: 'Inscrições encerradas.',
            rouletteMissingFilter: 'Filtro de inscrição ausente.',
            rouletteInscriptionsOpened: 'Inscrições abertas.',
            rouletteAnnounceOn: 'Anúncios ativados.',
            rouletteAnnounceOff: 'Anúncios desativados.',
            trendsChatError: 'Erro no chat de tendências.',
            trendsWinner: (word: string, count: number): string => `Tendência vencedora: ${word} (${count} menções)!`,
            trendsTimeUp: 'Tempo esgotado!',
            trendsStarted: (minutes: number): string => `Tendências iniciadas por ${minutes} minutos.`,
            overlayExpired: 'Link do overlay expirado.',
            sessionExpired: 'Sessão expirada.'
        }
    },
    clips: {
        title: 'Clips',
        info: 'Explore e gerencie seus clips da Twitch.',
        btnFavsOnly: 'Mostrar apenas favoritos',
        btnReload: 'Recarregar clips',
        tooltip: 'Gerenciamento de clips',
        searchPlaceholder: 'Buscar clips...',
        sortLabel: 'Ordenar por',
        noClips: 'Nenhum clip encontrado.',
        viewClip: 'Ver Clip',
        playClip: (title) => `Reproduzir clip: ${title}`,
        favorite: 'Adicionar aos favoritos',
        copyLink: 'Copiar link',
        untitled: 'Sem título',
        views: 'visualizações',
        loadMore: 'Carregar mais',
        sort: {
            dateDesc: 'Mais recentes',
            dateAsc: 'Mais antigos',
            viewsDesc: 'Mais vistos',
            viewsAsc: 'Menos vistos',
        },
        toasts: {
            updated: 'Clips atualizados',
            errorLoad: 'Erro ao carregar clips',
            copied: 'Link copiado',
            copyError: 'Erro ao copiar',
        },
        overlay: {
            close: 'Fechar',
            openTwitch: 'Abrir na Twitch',
            errorInfo: 'Erro ao carregar',
            player: 'Player de Clips',
            defaultTitle: 'Clip',
        }
    },
    commands: {
        config: {
            follow: {
                title: 'Comando !followage',
                desc: 'Mostra há quanto tempo alguém te segue',
                info: 'Gera o código para seu bot responder com o tempo exato que um usuário te segue.',
                templatePlaceholder: 'Ex: {user} está sofrendo há {time}.',
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
            }
        },
        generator: {
            variables: 'Variáveis disponíveis:',
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
        },
    },
    feedback: {
        hintAnonymous: 'A mensagem será anônima',
        hintDiscord: (username: string): string => `Você será contactado via Discord (${username})`,
        hintTwitch: (username: string): string => `Você será contactado via Twitch (${username})`,
        errorEmpty: 'A mensagem não pode estar vazia',
        successSend: 'Mensagem enviada com sucesso',
        errorSend: 'Erro ao enviar mensagem',
        errorGeneric: 'Ocorreu um erro inesperado',
        title: 'Enviar Feedback',
        desc: 'Ajude-nos a melhorar',
        infoTooltip: 'Envie sugestões ou reporte bugs',
        messageLabel: 'Mensagem',
        messagePlaceholder: 'Digite sua mensagem aqui...',
        anonymousTitle: 'Enviar anonimamente',
        anonymousOn: 'Ativado (Anônimo)',
        anonymousOff: 'Desativado (Público)',
        sendAs: 'Enviar como',
        linkDiscordText: 'Entre no nosso ',
        linkDiscordBold: 'Discord',
        linkDiscordEnd: ' para suporte rápido.',
        footerText: 'Obrigado pelo seu feedback.',
        btnSending: 'Enviando...',
        btnSend: 'Enviar Mensagem',
    },
    minigames: {
        magic8: {
            title: 'Bola 8 Mágica',
            desc: 'Respostas aleatórias às suas perguntas',
            info: 'Minijogo do chat',
            testDesc: 'Teste a Bola 8 Mágica',
            testInfo: 'Envie uma pergunta de teste',
            questionLabel: 'Pergunta',
            questionPlaceholder: 'Vou ganhar a partida?',
            btnLoading: 'Perguntando...',
            btnAsk: 'Perguntar',
            loadingResult: 'Aguardando resposta...',
            errorEmpty: 'A pergunta não pode estar vazia',
            testTitle: 'Testar Bola 8',
        },
        duel: {
            title: 'Duelo',
            desc: 'Confronto entre espectadores',
            info: 'Minijogo do chat',
            errorEmptyTarget: 'Você precisa especificar um alvo',
            errorInvalidLogin: 'Usuário inválido',
            testTitle: 'Testar Duelo',
            testDesc: 'Inicie um duelo de teste',
            testInfo: 'Simule um duelo no chat',
            targetLabel: 'Alvo',
            targetPlaceholder: 'Ex: João',
            challengerLabel: 'Desafiante',
            challengerPlaceholder: 'Ex: Pedro',
            btnLoading: 'Lutando...',
            btnFight: 'Lutar',
            loadingResult: 'Aguardando resultado...',
        },
        russian: {
            title: 'Roleta Russa',
            desc: 'Jogo de risco para o chat',
            info: 'Minijogo do chat',
            errorUnknown: 'Erro desconhecido',
            errorJammed: 'A arma travou',
            testTitle: 'Testar Roleta Russa',
            testDesc: 'Inicie o jogo de teste',
            btnTrigger: 'Puxar o gatilho',
            loadingResult: 'Aguardando...',
        },
        roulette: {
            title: 'Roleta de Sorteio',
            desc: 'Sorteios dinâmicos ao vivo',
            info: 'Overlay interativo',
            noParticipants: 'Sem participantes',
            pressPlay: 'Pressione Girar para começar',
            spinning: 'Girando...',
            winner: 'Vencedor!',
            participants: 'Participantes',
            notAnnounced: 'Não anunciado',
            close: 'Fechar',
            announceChatOn: 'Anunciar no chat (Ativado)',
            announceChatOff: 'Anunciar no chat (Desativado)',
            inChat: 'No chat',
            pauseEntries: 'Pausar inscrições',
            openEntries: 'Abrir inscrições',
            listUpdated: 'Lista atualizada',
            reloadUsers: 'Recarregar usuários',
            infoTooltip: 'Selecione quem pode participar',
            spinBtn: 'Girar Roleta',
            twitchDelay: 'Delay da Twitch ~3s',
            waitingChat: 'Aguardando chat...',
            whoCanPlay: 'Quem pode jogar',
            all: 'Todos',
            none: 'Ninguém',
            roles: {
                subs: 'Inscritos',
                mods: 'Mods',
                vips: 'VIPs',
                viewers: 'Espectadores'
            }
        },
    },
    stalker: {
        toasts: {
            copied: 'Copiado para a área de transferência',
            cleared: 'Lista limpa',
            error: 'Erro de conexão',
            started: 'Stalker iniciado',
            paused: 'Stalker pausado',
            errorLoad: 'Erro ao carregar',
            errorChat: 'Erro no chat',
            errorInfo: 'Erro de informação',
            reloaded: 'Recarregado com sucesso',
        },
        title: 'Modo Stalker',
        info: 'Analise o chat em tempo real',
        searchPlaceholder: 'Buscar nas mensagens...',
        btnPause: 'Pausar',
        btnStart: 'Iniciar',
        btnReload: 'Limpar',
        tooltip: 'Monitor de palavras-chave',
        table: {
            user: 'Usuário',
            message: 'Mensagem',
            time: 'Hora',
            actions: 'Ações',
            empty: 'Sem dados',
            avatar: 'Avatar',
            login: 'Login',
            action: 'Ação',
            readyTitle: 'Pronto para iniciar',
            readyDesc: 'O monitor está aguardando.',
            waiting: 'Aguardando mensagens...',
            btnView: 'Ver na Twitch',
        },
        footer: 'Exibindo mensagens mais recentes',
    },
    trends: {
        countdown: (val: string): string => `${val} restante`,
        remaining: 'restante',
        title: (duration?: string): string => duration ? `Tendências (${duration})` : 'Tendências (Top Palavras)',
        status: {
            idle: 'Inativo',
            active: 'Ativo',
            finished: 'Concluído',
            error: 'Erro',
            connected: 'Conectado',
            connecting: 'Conectando...',
            synced: 'Sincronizado',
        },
        info: 'Mede as palavras mais usadas',
        duration: 'Duração (minutos)',
        btnDecrease: '-',
        inputLabel: 'Minutos',
        min: 'min',
        btnIncrease: '+',
        startTimer: 'Iniciar Medição',
        reset: 'Resetar',
        tooltip: 'Mede o engajamento do chat',
        table: {
            word: 'Palavra',
            count: 'Menções',
            empty: 'Dados insuficientes',
            reps: 'Repetições',
            readyTitle: 'Pronto para iniciar',
            readyDesc: 'Selecione o tempo e inicie.',
            waiting: 'Aguardando dados...',
            noData: 'Dados insuficientes',
        },
    },
    overlay: {
        button: {
            title: 'Abrir guia do overlay',
            aria: 'Configurar overlay',
            label: 'Overlay'
        },
        setupModal: {
            titlePrefix: 'Overlay —',
            description: 'Siga as instruções para conectar o overlay ao seu software de streaming.',
            warning: 'A URL contém seu token secreto.',
            warningBold: 'Não a compartilhe publicamente.',
            generating: 'Gerando link…',
            copying: 'Copiando…',
            copied: 'Copiado para a Área de Transferência!',
            copySrc: 'Copiar URL da Fonte',
            generateError: 'Não foi possível gerar a URL do overlay',
            copySuccess: 'URL do overlay copiada',
            copyError: 'Não foi possível copiar a URL'
        },
        guide: {
            obsTitle: 'Configuração no OBS',
            obsSteps: {
                sourceTitle: 'Nova fonte',
                sourceDetail: 'Fontes → Fonte de Navegador.',
                urlTitle: 'Colar URL',
                urlDetail: 'Cole a URL que você copiou do painel (botão Overlay).',
                sizeTitle: 'Tamanho',
                sizeDetail: (size: string): string => `${size}, fundo transparente.`,
                refreshTitle: 'Ao ativar cena',
                refreshDetail: 'Marque "Atualizar navegador quando a cena ficar ativa".'
            },
            obsNote: 'Só exibe na tela. Para iniciar, girar ou resetar, use o painel.',
            slTitle: 'Configuração no Streamlabs',
            slSteps: {
                sourceTitle: 'Nova fonte',
                sourceDetail: 'Fontes → Widget Personalizado ou Fonte de Navegador.',
                urlTitle: 'Colar URL',
                urlDetail: 'Cole a URL que você copiou do painel (botão Overlay).',
                sizeTitle: 'Tamanho',
                sizeDetail: (size: string): string => `${size}, sem cor de fundo.`,
                refreshTitle: 'Ao mostrar cena',
                refreshDetail: 'Ative a atualização automática se seu plano permitir.'
            },
            slNote: 'Se a fonte ficar preta, verifique o tamanho, fundo transparente e atualização ao mostrar cena.',
            tools: {
                trends: 'Tendências',
                roulette: 'Roleta'
            },
            sizes: {
                trends: '900 × 580 px (top 10; largura total se preferir)',
                roulette: '720 × 720 px'
            }
        },
        banners: {
            connecting: 'Conectando overlay…',
            waiting: 'Aguardando dados do painel…'
        },
        gate: {
            invalidLink: 'Link de overlay inválido. Gere um novo no painel.'
        },
        apps: {
            rouletteErrorTitle: 'Overlay de Roleta',
            trendsErrorTitle: 'Overlay de Tendências'
        }
    }
};
