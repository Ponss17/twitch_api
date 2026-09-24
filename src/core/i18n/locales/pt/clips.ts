/** Fragmento i18n: clips (pt). */
export const clips = {
clips: {
        title: 'Clips',
        info: 'Explore e gerencie seus clips da Twitch.',
        btnFavsOnly: 'Mostrar apenas favoritos',
        btnReload: 'Recarregar clips',
        btnExportCsv: 'Exportar galeria para CSV',
        tooltip: 'Ferramentas de clip: download, VOD e CSV.',
        searchPlaceholder: 'Buscar por título ou criador...',
        sortLabel: 'Ordenar por',
        noClips: 'Nenhum clip encontrado.',
        viewClip: 'Ver Clip',
        playClip: (title: string): string => `Reproduzir clip: ${title}`,
        favorite: 'Adicionar aos favoritos',
        copyLink: 'Copiar link',
        download: 'Baixar MP4',
        openVod: 'Ver no VOD',
        byCreator: 'por {name}',
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
            downloaded: 'Clip baixado',
            downloadOpened: 'Vídeo aberto — salve pelo navegador',
            downloadUnavailable: 'Não foi possível obter o MP4 deste clip',
            downloadNeedsRelogin:
                'Para baixar clips, saia e entre de novo com a Twitch (nova permissão).',
            csvExported: 'CSV de clips baixado',
            csvEmpty: 'Não há clips para exportar',
        },
        overlay: {
            close: 'Fechar',
            openTwitch: 'Abrir na Twitch',
            errorInfo: 'Erro ao carregar',
            player: 'Player de Clips',
            defaultTitle: 'Clip',
        }
    }
};
