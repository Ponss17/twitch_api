/** Fragmento i18n: clips (es). */
export const clips = {
clips: {
        title: 'Clips',
        info: 'Explora y gestiona tus clips de Twitch.',
        btnFavsOnly: 'Mostrar solo favoritos',
        btnReload: 'Recargar clips',
        btnExportCsv: 'Exportar galería a CSV',
        tooltip: 'Gestión de clips: descarga, VOD y CSV.',
        searchPlaceholder: 'Buscar por título o creador...',
        sortLabel: 'Ordenar por',
        noClips: 'No se encontraron clips.',
        viewClip: 'Ver Clip',
        playClip: (title: string): string => `Reproducir clip: ${title}`,
        favorite: 'Añadir a favoritos',
        copyLink: 'Copiar enlace',
        download: 'Descargar MP4',
        openVod: 'Ver en el VOD',
        byCreator: 'por {name}',
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
            downloaded: 'Clip descargado',
            downloadOpened: 'Se abrió el vídeo: guárdalo desde el navegador',
            downloadUnavailable: 'No se pudo obtener el MP4 de este clip',
            downloadNeedsRelogin:
                'Para descargar clips, cierra sesión y vuelve a entrar con Twitch (permiso nuevo).',
            csvExported: 'CSV de clips descargado',
            csvEmpty: 'No hay clips para exportar',
        },
        overlay: {
            close: 'Cerrar',
            openTwitch: 'Abrir en Twitch',
            errorInfo: 'Error al cargar',
            player: 'Reproductor de Clip',
            defaultTitle: 'Clip',
        }
    }
};
