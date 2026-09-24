/** Fragmento i18n: reports (pt). */
export const reports = {
reports: {
        title: 'Relatórios',
        eyebrow: 'Mês fechado',
        browseByMonth: 'Arquivo',
        months: 'Meses',
        metaCategory: 'Relatório guardado',
        latestBadge: 'Mais recente',
        entryTitle: 'Relatório de {month}',
        checkUses: '{count} usos no total',
        checkSuccess: '{rate}% sem erro',
        checkCommand: 'Mais usado: {command}',
        checkViewer: 'Top chat: {viewer}',
        checkLatency: '{ms} ms em média',
        intro: 'Resumo fechado do uso dos seus comandos LosPerris no chat naquele mês.',
        note: 'Isto não é Análises ao vivo nem dados da Twitch — é um relatório do mês já fechado (só uso da API).',
        story: 'Aquele mês fechou com {uses} usos de comandos ({rate}% OK). O mais pedido foi {command}. No chat, quem mais disparou foi {viewer}.',
        storyTitle: 'Em poucas palavras',
        storyNoCommand: 'nenhum comando',
        storyNoViewer: 'ninguém do chat',
        downloadTitle: 'Guardar o relatório',
        downloadAction: 'Baixar',
        downloadHtmlDesc: 'Página pronta para guardar ou compartilhar.',
        downloadCsvDesc: 'Para Excel ou Google Sheets.',
        emptyTitle: 'Ainda sem mês fechado',
        emptyBody:
            'Quando um mês terminar com uso de comandos, o relatório arquivado aparece aqui e avisamos no sino. Para o momento atual, use Análises.',
        emptyCtaAnalytics: 'Ir para Análises (ao vivo)',
        emptyCtaCommands: 'Configurar um comando',
        monthMeta: '{count} usos · {rate}% OK',
        monthMetaOne: '1 uso · {rate}% OK',
        commands: 'Detalhe: comandos',
        commandsHint: 'O que o chat pediu naquele mês',
        listCommand: 'Comando',
        listUses: 'Usos',
        listLatency: 'Média',
        listViewer: 'Usuário',
        noCommands: 'Sem comandos naquele mês',
        commandUses: '{count} vezes',
        commandUsesOne: '1 vez',
        commandLatency: '{ms} ms em média',
        topViewers: 'Detalhe: chat',
        topViewersHint: 'Quem disparou comandos naquele mês',
        viewerUses: '{count} vezes',
        viewerUsesOne: '1 vez',
        noViewers: 'Ninguém do chat usou comandos naquele mês.',
        lowActivity:
            'Foi um mês calmo ({count} usos). Normal se você acabava de configurar.',
        lowActivityOne:
            'Só houve 1 uso naquele mês. Normal se você acabava de configurar.',
        downloadHtml: 'Baixar HTML',
        downloadCsv: 'Baixar CSV',
        loadError: 'Não foi possível carregar os relatórios.',
        vsPrevious: 'Vs {month}: sem mudança nos usos',
        vsPreviousUp: 'Vs {month}: {delta} usos a mais',
        vsPreviousDown: 'Vs {month}: {delta} usos a menos',
        notificationTitle: 'Relatório pronto: {month}',
        notificationBody: 'Já dá para ler ou baixar o resumo do mês fechado.',
        openReport: 'Abrir relatório',
        howItWorks: 'Como funciona?',
        howItWorksDesc: 'Sobre os relatórios do mês fechado',
        howItWorksFaq: [
            {
                q: 'O que o Relatórios guarda?',
                a: 'Ao fechar um mês em que você usou comandos LosPerris, arquivamos esses dados do mês terminado. Não é o painel ao vivo: Análises continua mostrando o momento atual; aqui fica o resumo já fechado para consultar ou baixar depois.'
            },
            {
                q: 'O mês atual aparece aqui?',
                a: 'Ainda não. O que você usa hoje aparece em Análises. O relatório daquele mês só é criado quando o mês termina e houve uso de comandos; se não houve uso, não se gera arquivo.'
            },
            {
                q: 'Se eu reiniciar estatísticas em Ajustes → Dados, os relatórios são apagados?',
                a: 'Não. Reiniciar estatísticas limpa o contador ao vivo, mas os relatórios já arquivados são mantidos. Só desaparecem se você excluir a conta por completo.'
            }
        ],
        kpis: {
            requests: 'Usos totais',
            requestsHint: 'Vezes que alguém usou um comando',
            success: 'Deram certo',
            successHint: 'Porcentagem sem erro',
            latency: 'Velocidade',
            latencyHint: 'Tempo médio de resposta',
            commands: 'Comandos distintos',
            commandsHint: 'Tipos de comando usados'
        }
    }
};
