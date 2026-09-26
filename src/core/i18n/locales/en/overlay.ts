/** Fragmento i18n: overlay (en). */
export const overlay = {
overlay: {
        button: {
            title: 'Open overlay guide',
            aria: 'Configure overlay',
            label: 'Overlay'
        },
        setupModal: {
            titlePrefix: 'Overlay —',
            description: 'Follow the instructions to connect the overlay to your streaming software.',
            warning: 'The URL contains your secret token.',
            warningBold: 'Do not share it publicly.',
            generating: 'Generating link…',
            copying: 'Copying…',
            copied: 'Copied to Clipboard!',
            copySrc: 'Copy Source URL',
            generateError: 'Could not generate the overlay URL',
            copySuccess: 'Overlay URL copied',
            copyError: 'Could not copy the URL'
        },
        guide: {
            obsTitle: 'Setup in OBS',
            obsSteps: {
                sourceTitle: 'New source',
                sourceDetail: 'Sources → Browser Source.',
                urlTitle: 'Paste URL',
                urlDetail:
                    'Copy the URL from the button below (includes your chosen color and size) and paste it in OBS.',
                sizeTitle: 'Width and height',
                sizeDetail: (size: string): string =>
                    `Set exactly ${size}, transparent background. If you change Small/Normal/Large above, use these new dimensions.`,
                refreshTitle: 'On scene active',
                refreshDetail:
                    'Check "Refresh browser when scene becomes active". If it stays blank when you return, try "Shutdown source when not visible".'
            },
            obsNote:
                'Pick color and size above before copying the URL. The overlay only displays; to start, spin, or reset, use the panel.',
            slTitle: 'Setup in Streamlabs',
            slSteps: {
                sourceTitle: 'New source',
                sourceDetail: 'Sources → Custom Widget or Browser Source.',
                urlTitle: 'Paste URL',
                urlDetail:
                    'Copy the URL from the button below (includes your chosen color and size) and paste it in Streamlabs.',
                sizeTitle: 'Width and height',
                sizeDetail: (size: string): string =>
                    `Set exactly ${size}, no background color. If you change Small/Normal/Large above, use these new dimensions.`,
                refreshTitle: 'On scene show',
                refreshDetail: 'Enable auto-refresh if your plan allows it.'
            },
            slNote:
                'Pick color and size above before copying the URL. If the source is black, check dimensions, transparent background, and refresh on scene show.',
            tools: {
                trends: 'Trends',
                roulette: 'Roulette',
                questions: 'Questions',
                'bits-roulette': 'Bits Roulette'
            },
            sizes: {
                trends: (w: number, h: number): string =>
                    `${w} × ${h} px (top 10; full width if preferred)`,
                roulette: (w: number, h: number): string => `${w} × ${h} px`,
                questions: (w: number, h: number): string =>
                    `${w} × ${h} px (current question; full width if preferred)`,
                'bits-roulette': (w: number, h: number): string => `${w} × ${h} px`
            }
        },
        appearance: {
            title: 'On-stream appearance',
            badge: 'Overlay only',
            desc: 'Color, size, and alert options go in the URL. OBS/Streamlabs dimensions below update when you pick Small, Normal, or Large.',
            colorLabel: 'Color',
            customColor: 'Custom color',
            preset: 'Preset',
            scaleLabel: 'Size',
            scaleSm: 'Small',
            scaleMd: 'Normal',
            scaleLg: 'Large'
        },
        questions: {
            now: 'Current question',
            waitingTitle: 'Listening',
            waitingHint: 'Viewers ask with !{keyword}',
            queue: '{count} in queue'
        },
        banners: {
            connecting: 'Connecting overlay…',
            waiting: 'Waiting for dashboard data…',
            unauthorized: 'Invalid or expired overlay link. Generate a new one from the dashboard.'
        },
        gate: {
            invalidLink: 'Invalid overlay link. Generate a new one from the dashboard.'
        },
        apps: {
            rouletteErrorTitle: 'Roulette Overlay',
            bitsRouletteErrorTitle: 'Bits Roulette Overlay',
            trendsErrorTitle: 'Trends Overlay',
            questionsErrorTitle: 'Questions Overlay'
        }
    }
};
