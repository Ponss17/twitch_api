/** Fragmento i18n: home (en). */
export const home = {
home: {
        title: 'Home',
        tabs: {
            home: 'Home',
            analytics: 'Analytics',
            settings: 'Settings',
        },
        welcome: 'Welcome',
        quickStats: 'Quick Stats',
        recentActivity: 'Recent Activity',
        noActivity: 'No recent activity.',
        requests: 'requests',
        successRate: 'success rate',
        avgLatency: 'avg latency',
        today: 'today',
        broadcaster: {
            partner: 'Partner',
            affiliate: 'Affiliate',
            streamer: 'Streamer'
        },
        resources: {
            title: 'Resources',
            commands: 'Most used',
            links: 'Useful links',
            about: 'About the API',
            docs: 'Documentation',
            status: 'System Status'
        },
        activityFeed: {
            title: 'Activity History',
            subtitle: 'Filter by category or resource in real-time •',
            syncing: 'Syncing...',
            liveBadge: 'LIVE',
            liveTooltip: 'Filter by category or resource. New events arrive live.',
            emptyFiltered: 'No results',
            emptyAll: 'No recent activity',
            emptyFilteredDesc: 'Try another filter or return to All.',
            emptyAllDesc: 'When someone uses a command in your chat, it will appear here.',
            emptyWithOnboarding: 'History will fill in on its own',
            emptyWithOnboardingDesc: 'Meanwhile, set up a command above.',
            all: 'All'
        },
        onboarding: {
            welcomeTitle: 'Welcome to LosPerrisAPI',
            welcomeBody: "Let me give you a quick tour of the main features so you can get up and running fast.",
            start: 'Start',
            skip: 'Skip',
            back: 'Back',
            next: 'Next',
            finish: 'Finish',
            stepOf: 'Step {step} of {total}',
            doneTitle: "You're all set!",
            doneBody: "Thanks for taking the tour. Enjoy the dashboard and feel free to explore every section at your own pace.",
            doneBtn: 'Start using it',
            steps: {
                'sidebar-nav': {
                    title: 'Navigation menu',
                    body: 'Navigate between all sections: Home, Analytics, Reports, Commands, Tools, and Minigames. On desktop you can collapse it to icon-only mode to save space.'
                },
                'home-hero': {
                    title: 'Channel overview',
                    body: 'Total followers, channel type and start date. This card is updated with your real Twitch data every time you open the dashboard.'
                },
                'home-activity': {
                    title: 'Real-time activity',
                    body: 'Every time someone uses a command in your chat it appears here instantly via WebSocket. Filter by category or click any entry to see the full details.'
                },
                'home-resources': {
                    title: 'Quick shortcuts',
                    body: 'Your top 3 most-used commands this week, plus direct links to the API and documentation. Updates automatically based on your activity.'
                },
                analytics: {
                    title: 'Channel analytics',
                    body: 'Usage charts by day, week or month. Compare which commands and tools are most popular in your community.'
                },
                followage: {
                    title: 'Command generator',
                    body: 'Copy the ready-to-use URL for Nightbot, StreamElements or any other bot. Choose the format, language and test the response directly from here.'
                }
            }
        },
        activityLog: {
            categories: {
                all: 'All',
                commands: 'Commands',
                tools: 'Tools',
                minigames: 'Minigames'
            },
            relativeTime: {
                now: 'just now',
                minutes: (mins: number): string => `${mins} min ago`,
                hours: (hours: number): string => `${hours} h ago`
            },
            date: {
                today: 'Today',
                yesterday: 'Yesterday'
            },
            types: {
                clip: { label: 'Clip', defaultDetail: 'New clip' },
                followage: { label: 'Followage', defaultDetail: 'Followage query', channel: (target: string): string => `Channel: ${target}` },
                watchtime: { label: 'Watchtime', defaultDetail: 'Watchtime lookup', channel: (target: string): string => `Channel: ${target}` },
                shoutout: { label: 'Shoutout', defaultDetail: 'Shoutout sent', to: (target: string): string => `To: ${target}` },
                message: { label: 'Message', defaultDetail: 'Chat message' },
                russian: { label: 'Russian Roulette', defaultDetail: 'Russian roulette game', channel: (target: string): string => `Channel: ${target}` },
                magic8: { label: 'Magic 8 Ball', defaultDetail: 'Magic 8 ball question' },
                duel: { label: 'Duel', defaultDetail: 'Duel started', vs: (target: string): string => `vs @${target}` },
                slots: { label: 'Slots', defaultDetail: 'Slots spin' },
                stalker: { label: 'Stalker', defaultDetail: 'Stalker scan' },
                trends: { label: 'Trends', defaultDetail: 'Trends tracking' },
                roulette: { label: 'Roulette', defaultDetail: 'Chatter roulette' },
                other: { label: 'Activity', defaultDetail: 'Logged event' }
            }
        },
        activityInspector: {
            title: 'Event Inspector',
            date: 'Date',
            time: 'Time',
            user: 'User',
            summary: 'Summary',
            technicalMetadata: 'Technical Metadata',
            copy: 'Copy',
            unknownDate: 'Unknown',
            unknownTime: '---',
            emptyMetadata: 'No additional metadata',
            fieldType: 'Type',
            fieldTimestamp: 'Timestamp',
            fieldTarget: 'Target',
            fieldTitle: 'Title',
            fieldUrl: 'URL',
            fieldMessage: 'Message',
            fieldQuestion: 'Question',
            fieldResponse: 'Response',
            fieldSource: 'Source',
            fieldAnnounce: 'Announce',
            fieldAction: 'Action',
            fieldClipId: 'Clip ID',
            fieldLatency: 'Latency',
            fieldLang: 'Language',
            fieldFormat: 'Format',
            fieldMood: 'Mood',
            fieldHardcore: 'Hardcore',
            fieldRawDetail: 'Detail',
            rawJson: 'event.json'
        }
    }
};
