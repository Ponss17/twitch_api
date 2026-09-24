/** Fragmento i18n: clips (en). */
export const clips = {
clips: {
        title: 'Clips',
        info: 'Explore and manage your Twitch clips.',
        btnFavsOnly: 'Show favorites only',
        btnReload: 'Reload clips',
        btnExportCsv: 'Export gallery to CSV',
        tooltip: 'Clip tools: download, VOD, and CSV.',
        searchPlaceholder: 'Search by title or creator...',
        sortLabel: 'Sort by',
        noClips: 'No clips found.',
        viewClip: 'View Clip',
        playClip: (title: string): string => `Play clip: ${title}`,
        favorite: 'Add to favorites',
        copyLink: 'Copy link',
        download: 'Download MP4',
        openVod: 'Open on VOD',
        byCreator: 'by {name}',
        untitled: 'Untitled',
        views: 'views',
        loadMore: 'Load more',
        sort: {
            dateDesc: 'Newest',
            dateAsc: 'Oldest',
            viewsDesc: 'Most viewed',
            viewsAsc: 'Least viewed',
        },
        toasts: {
            updated: 'Clips updated',
            errorLoad: 'Error loading clips',
            copied: 'Link copied',
            copyError: 'Error copying',
            downloaded: 'Clip downloaded',
            downloadOpened: 'Video opened — save it from the browser',
            downloadUnavailable: 'Could not get the MP4 for this clip',
            downloadNeedsRelogin:
                'To download clips, sign out and sign back in with Twitch (new permission).',
            csvExported: 'Clips CSV downloaded',
            csvEmpty: 'No clips to export',
        },
        overlay: {
            close: 'Close',
            openTwitch: 'Open on Twitch',
            errorInfo: 'Error loading',
            player: 'Clip Player',
            defaultTitle: 'Clip',
        }
    }
};
