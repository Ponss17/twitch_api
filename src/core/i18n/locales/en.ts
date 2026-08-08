import type { Translations } from './es';

export const en: Translations = {
    legal: {
        introTerms: 'These terms govern the access and use of **LosPerrisBot**, available at [ttv.losperris.dev](https://ttv.losperris.dev). By using the site, connecting your Twitch account (the app appears as **LosPerris - API**), or using your API Key, you agree to these conditions and the privacy policy.',
        introPrivacy: 'This policy describes the processing of personal information on [ttv.losperris.dev](https://ttv.losperris.dev) by **LosPerrisBot**. When connecting Twitch, the authorized app is identified as **LosPerris - API**.',
        introCookies: 'This document complements the privacy policy and describes the use of local storage and similar technologies on **LosPerrisBot**. We do not use advertising cookies or sell data derived from browsing.',
        sections: [
            {
                title: 'Service Description',
                content: 'We provide an interactive dashboard for Twitch that allows streamers to interact with their audience through commands, minigames, and an on-screen overlay. We do not store audio, video, or bank credentials.'
            },
            {
                title: 'User Obligations',
                content: 'By logging in, you agree that you are the owner of the Twitch account or are authorized to use it. You can export or delete your data in the Settings tab of the dashboard at any time.'
            },
            {
                title: 'Prohibited Conduct',
                content: 'Using the service for massive spam, illegal activities, or any action that violates the Twitch Terms of Service is prohibited. We reserve the right to revoke access to accounts that abuse the API limits.'
            },
            {
                title: 'Limitation of Liability',
                content: 'The service is provided "as is". We do not guarantee 100% availability or take responsibility for direct or indirect damages resulting from interruptions, data loss, or changes to the Twitch API.'
            },
            {
                title: 'Service Suspension',
                content: 'We may temporarily suspend access for maintenance or if we detect anomalous traffic that puts the shared infrastructure at risk.'
            },
            {
                title: 'Modifications',
                content: 'We may modify these terms at any time. Continued use of the service following changes constitutes your acceptance.'
            },
            {
                title: 'Who manages the data',
                content: 'Your data is processed by LosPerrisBot, operating under the infrastructure detailed below. We act as intermediaries between your Twitch account and the dashboard features.'
            },
            {
                title: 'Data we collect',
                content: 'We collect your Twitch ID, login, affiliate status, and account creation date to provide primary authentication. We store your custom settings (commands, minigames) and a temporary log of the last 200 events occurring in your channel to feed your dashboard.'
            },
            {
                title: 'Data we do not collect',
                content: 'We do not store passwords (we use OAuth2). We do not collect, read, or store chat messages other than invocations to specific bot commands. We do not collect payment or address information.'
            },
            {
                title: 'Data Usage',
                content: 'Your data is used exclusively to enable the functionalities of your dashboard, process your minigame settings, and statistics. We do not sell or transfer data to third parties for advertising purposes.'
            },
            {
                title: 'Providers and third parties',
                content: 'We share strictly necessary minimal data with our infrastructure providers: Twitch (authentication and querying), Supabase (profile storage), Vercel (hosting and metrics), Groq (text processing in Magic 8 Ball), and Discord (only if you send voluntary feedback).'
            },
            {
                title: 'Data Retention',
                content: 'Profiles and settings are kept as long as the account is active. Channel activity logs are automatically truncated to the 200 most recent events per user. If you delete your account, they are immediately erased from the main database.'
            },
            {
                title: 'User Rights',
                content: 'You have the right to know what data we have, correct inaccurate data, and export or delete your account from the dashboard Settings section at any time. Deletion is permanent.'
            },
            {
                title: 'Cookies and local storage',
                content: 'We use encrypted session cookies and local storage (localStorage/IndexedDB) strictly necessary to keep your session active, cache stats, and persist your dashboard preferences (dark mode, language).'
            },
            {
                title: 'Minors',
                content: 'The service is directed at users over 13 years old (or the minimum age required by Twitch in their country). We do not intentionally collect data from minors under that age.'
            },
            {
                title: 'Security',
                content: 'We implement encryption in transit (HTTPS) and at rest via Supabase. Your session token is short-lived and automatically renewed. We never expose Twitch API tokens to the client.'
            },
            {
                title: 'Updates',
                content: 'This policy may be updated. The last revision date will always be visible at the bottom of this document.'
            },
            {
                title: 'Local Storage',
                content: 'LocalStorage is used to retain your API Key, your dashboard preferences, and speed up page loading by caching temporary responses.'
            },
            {
                title: 'Service worker',
                content: 'We may employ Service Workers to support notifications or offline capabilities of the dashboard, which reside on your local device.'
            },
            {
                title: 'Performance Metrics',
                content: 'We use Vercel Web Vitals and Speed Insights anonymously to monitor load times and identify bottlenecks in the platform.'
            },
            {
                title: 'Clearing storage',
                content: 'You can clear all local storage by logging out, clearing site data in your browser, or using the clear stats button in Settings.'
            }
        ]
    },
    exporter: {
        home: 'Home',
        docs: 'Documentation',
        dashboard: 'Dashboard',
        reportBadge: 'Account Report',
        followers: 'Followers',
        today: 'Today',
        total: 'Total',
        success: 'Success',
        profile: 'Profile',
        accountInfo: 'Account Information',
        name: 'Name',
        login: 'Login',
        channelType: 'Channel Type',
        memberSince: 'Member Since',
        bio: 'Biography',
        access: 'Access',
        securityAndApiKey: 'Security & API Key',
        status: 'Status',
        active: 'Active',
        limit: 'Limit',
        level: 'Level',
        metrics: 'Metrics',
        apiPerformance: 'API Performance',
        recentActivity: 'Recent Activity',
        noRecentActivity: 'No recent activity to show.',
        links: 'Links',
        legal: 'Legal',
        privacyPolicy: 'Privacy Policy',
        terms: 'Terms',
        generatedOn: 'Generated on',
        at: 'at'
    },
    // --- VerifyingSessionModal ---
    verifying: {
        authenticated: 'AUTHENTICATED',
        accessGranted: 'Access granted. Redirecting...',
        cacheActive: 'Local cache active — fast load.',
        noCache: 'Syncing secure profile...',
    },

    // --- Settings: General ---
    settings: {
        title: 'Settings',
        tabs: {
            general: 'General',
            data: 'Data',
            security: 'Security',
            connections: 'Connections',
            sessionExpiredLogin: 'Session expired. Please log in again.',
            overlayExpired: 'Overlay link expired. Please generate a new one in your dashboard.',
            unstableConnection: 'Unstable connection with Twitch. Retrying...'
        },
        account: {
            title: 'Account',
            description: 'Your plan identifier and limits',
        },
        preferences: {
            title: 'Preferences',
            description: 'Account settings',
            timezone: {
                label: 'Time Zone',
                description: 'Your time zone is used to correctly group and display days in your stats and reports.',
                searchPlaceholder: 'Search time zone...',
                searchAriaLabel: 'Search time zone',
                noResults: 'No results found',
                save: 'Save',
                saving: 'Saving...',
            },
            language: {
                label: 'Interface Language',
                description: 'Choose the language in which the control panel is displayed.',
            },
            theme: {
                label: 'Interface Theme',
                description: 'Choose the color scheme of the application.',
                options: {
                    dark: 'Dark',
                    light: 'Light',
                    liga: 'Liga (LDA)',
                    minimal: 'Minimal',
                    matrix: 'Neo Matrix'
                }
            },
        },
        data: {
            title: 'Data',
            description: 'Export your account information',
        },
        // Toasts
        toasts: {
            settingsSaved: 'Settings saved successfully.',
            settingsError: 'Error saving settings.',
            networkError: 'Network error while saving settings.',
            invalidSession: 'Invalid session or CSRF rejected. Please reload the page.',
            regenError: 'Error regenerating API Key',
            regenSuccess: 'New API Key generated',
            clearError: 'Connection error clearing data',
            clearSuccess: 'Statistics reset',
            deleteError: 'Connection error deleting account',
            deleteSuccess: 'Account deleted. Redirecting...',
            copyKeySuccess: 'API Key copied',
            copyKeyError: 'Could not copy API Key',
            copyIdSuccess: 'ID copied',
            limitError: 'Connection error checking limit.',
            connectionError: 'Connection error.',
            discordUnlinkError: 'Could not unlink Discord',
            discordUnlinkSuccess: 'Discord unlinked',
            profileError: 'Error loading profile',
            discordLinkSuccess: 'Discord linked successfully',
            discordLinkTaken: 'That Discord is already linked to another account',
            discordLinkAuth: 'You must log in to link Discord',
            discordLinkConfig: 'Discord linking is not available right now',
            discordLinkError: 'Could not link Discord',
            exportLimitError: 'You must wait before generating another report.'
        },
        dangerModals: {
            resetTitle: 'Reset Statistics',
            resetDesc: 'This action will erase all command history, clips, and latency data. Your account and API Key will remain active.',
            resetWord: 'CLEAR',
            resetConfirm: 'Confirm and Clear',
            deleteTitle: 'Delete LosPerris API Profile',
            deleteDesc: 'WARNING! This action is irreversible within our platform. Your data and API Key will be deleted. This will NOT affect your Twitch channel or account in any way.',
            deleteWord: 'DELETE',
            deleteConfirm: 'Confirm and Delete'
        },
        hero: {
            hello: 'Hello,',
            welcome: 'Welcome to your dashboard · activity and quick shortcuts',
            followers: 'Followers',
            channelType: 'Channel Type',
            memberSince: 'Member Since',
            notAvailable: 'Not available right now'
        },
        groups: {
            account: { title: 'Account', desc: 'Your plan identifier and limits' },
            preferences: { title: 'Preferences', desc: 'Account settings' },
            data: { 
                title: 'Account Data', 
                desc: 'Information and management of your account data.',
                firstLogin: 'First Login',
                firstLoginDesc: 'Date when you first logged in.',
                lastLogin: 'Last Previous Login',
                lastLoginDesc: 'Date of your last session before the current one.'
            },
            export: { title: 'Export', desc: 'Export your account information' },
            security: { title: 'Security', desc: 'Keys and access' },
            dangerZone: { title: 'Danger Zone', desc: 'Destructive actions' },
            discord: { title: 'Discord', desc: 'Integrations' }
        },
        panels: {
            userId: 'User ID',
            copyUserId: 'Copy User ID',
            planAndQuota: 'Plan and quota',
            planTooltip: 'Your API plan: higher = more quota and fresher data',
            apiQuotaTooltip: 'Requests per minute with your API Key (commands and integrations)',
            heavyQuotaTooltip: 'Heavy endpoints quota (clips / chatters) with API Key',
            cacheTooltip: 'Bot commands cache retention (followage, etc.)',
            planTier: 'Plan',
            requestsLimit: 'Requests / min',
            heavyLimit: 'Heavy / 10m',
            cacheTime: 'Cache (min)',
            apiKeyPrivate: 'Private API Key',
            apiKeyInfo: 'Keep this information private. Do not share it on stream.',
            apiKeyWarning: 'Your personal, non-transferable key. Use it in Nightbot, StreamElements, etc.',
            activeKey: 'Active API Key',
            activeKeyDesc: 'Ready to authenticate requests (Bearer).',
            toggleVisibility: 'Show/Hide',
            copyKey: 'Copy',
            regenKey: 'Regenerate',
            dangerZoneTitle: 'Danger Zone',
            resetStats: 'Reset Statistics',
            resetStatsDesc: 'Clears historical usage and analytics. Does not affect your account.',
            deleteAccount: 'Delete Account',
            deleteAccountDesc: 'Permanently deletes all your data and logs you out.',
            discordTitle: 'Discord',
            discordStatus: (linked: boolean): string => (linked ? 'Connected' : 'Not connected'),
            linkDiscord: 'Link Discord',
            unlinkDiscord: 'Unlink Discord',
            fullReport: 'Full Account Report',
            exportReport: 'Export Data',
            exportDesc: 'Download a JSON file with your activity history and settings for data portability compliance.'
        },
    },

    // --- Dashboard Home ---
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
            commands: 'Quick commands',
            links: 'Useful links',
            about: 'About the API',
            docs: 'Documentation',
            status: 'System Status'
        },
        activityFeed: {
            title: 'Activity History',
            subtitle: 'Filter by category or resource in real-time •',
            syncing: 'Syncing...',
            liveTooltip: 'Filter by category or resource. New events arrive live.',
            emptyFiltered: 'No results',
            emptyAll: 'No recent activity',
            emptyFilteredDesc: 'Try another filter or return to All.',
            emptyAllDesc: 'When someone uses a command in your chat, it will appear here.',
            all: 'All'
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
                shoutout: { label: 'Shoutout', defaultDetail: 'Shoutout sent', to: (target: string): string => `To: ${target}` },
                message: { label: 'Message', defaultDetail: 'Chat message' },
                russian: { label: 'Russian Roulette', defaultDetail: 'Russian roulette game', channel: (target: string): string => `Channel: ${target}` },
                magic8: { label: 'Magic 8 Ball', defaultDetail: 'Magic 8 ball question' },
                duel: { label: 'Duel', defaultDetail: 'Duel started', vs: (target: string): string => `vs @${target}` },
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
            unknownTime: '---'
        }
    },
    analytics: {
        other: 'Other',
        kpis: {
            title: 'Global Performance',
            info: 'Aggregated metrics of your API usage.',
            today: 'Today',
            sevenDays: '7d',
            requests: 'Total Requests',
            successRate: 'Success Rate',
            latency: 'Avg Latency',
            commands: 'Commands Used',
            requestsToday: 'Requests today',
            requests7d: 'Requests in 7 days',
            successToday: 'Success today',
            success7d: 'Success in 7 days',
            latencyToday: 'Response time today',
            latency7d: 'Response time in 7 days',
            commandsToday: 'Unique commands today',
            commands7d: 'Unique commands in 7 days'
        },
        todayChart: {
            title: 'Activity Today (Hourly)',
            info: 'Hourly distribution of requests.',
            success: 'Successes',
            errors: 'Errors',
            successRate: 'Success Rate',
            total: 'Total Requests',
            noData: 'No data today',
            noDataSub: 'Use a command'
        },
        latencyChart: {
            title: 'Performance & Latency',
            info: 'Response time per command.',
            noData: 'No latency',
            noDataSub: 'Waiting for data',
            latency: 'Avg Latency'
        },
        endpointsTable: {
            title: 'Most Used Commands',
            info: 'List of commands with requests, success rate, and avg latency.',
            noData: 'Not enough data',
            noDataSub: 'Run commands in your channel to generate history',
            headers: {
                command: 'Command',
                requests: 'Requests',
                success: 'Success',
                latency: 'Latency'
            }
        },
        distributionChart: {
            title: 'Command Distribution',
            info: 'Requests per command.',
            noData: 'No commands',
            noDataSub: 'Start activity'
        },
        areaChart: {
            title: 'Traffic & Errors (7 days)',
            info: 'History of the last 7 days. Today updates in real-time.',
            requests: 'Requests',
            noData: 'No activity',
            noDataSub: 'Waiting for events'
        },
        leaderboard: {
            title: 'Top Users',
            infoToday: 'Most active users today.',
            info7d: 'Most active users in 7 days.',
            noData: 'No users',
            noDataSub: 'Waiting for interactions',
            rankingToday: 'Top Today',
            ranking7d: 'Top 7 Days',
            totalInteractions: 'interactions',
            totalInteractionsTooltip: 'Total uses by all viewers',
            unitSingular: 'use',
            unitPlural: 'uses'
        }
    },

    header: {
        subtitles: {
            home: 'Summary of your recent activity',
            analytics: 'Detailed API statistics',
            settings: 'Account configuration',
            followage: 'Check how long someone has been following',
            watchtime: 'Check how long someone has been watching the stream',
            clips: 'Explore and manage your Twitch clips',
            shoutout: 'Promote other streamers in your channel',
            trends: 'Discover the most used words in your chat',
            stalker: 'Monitor messages from specific users',
            roulette: 'Quick and interactive giveaways',
            magic8: 'Fun answers to chat questions',
            russian: 'Russian roulette minigame for viewers',
            duel: '1vs1 battles between viewers',
            feedback: 'Send suggestions or report bugs',
            default: 'Dashboard'
        },
        closeMenu: 'Close menu',
        openMenu: 'Open menu',
        accountMenu: 'Account menu',
        myAccount: 'MY ACCOUNT',
        settings: 'Settings',
        twitchProfile: 'Twitch Profile',
        supportProject: 'Support Project',
        logout: 'Log Out'
    },

    sidebar: {
        categories: {
            general: 'General',
            commands: 'Commands',
            tools: 'Tools',
            minigames: 'Minigames',
            support: 'Support'
        },
        items: {
            home: 'Home',
            analytics: 'Analytics',
            followage: 'Followage',
            watchtime: 'Watchtime',
            clips: 'Clips',
            shoutout: 'Shoutout',
            trends: 'Trends',
            stalker: 'Stalker',
            roulette: 'Roulette',
            magic8: 'Magic 8 Ball',
            russian: 'Russian Roulette',
            duel: 'Duel',
            feedback: 'Feedback',
            settings: 'Settings'
        },
        docs: 'Documentation',
        discord: 'Community',
        navigation: 'Dashboard Navigation'
    },

    // --- Common ---
    common: {
        channel: 'Channel',
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
        confirm: 'Confirm',
        copy: 'Copy',
        copied: 'Copied',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        tabError: 'Error loading tab',
        aria: {
            close: 'Close',
            closePanel: 'Close panel',
            moreInfo: 'More information',
            verifyingSession: 'Verifying session',
            streamingPlatform: 'Streaming platform',
            feedbackIdentity: 'Feedback identity',
            legalSections: 'Legal sections',
            settingsSections: 'Settings sections',
            filterResource: 'Filter by resource'
        }
    },
    modals: {
        danger: {
            typeToConfirm: (word: string): string => `Type "${word}" to confirm`,
            placeholder: 'Type here...',
            processing: 'Processing...',
            cancel: 'Cancel',
            defaultConfirm: 'Confirm and Delete',
        },
        regenKey: {
            title: 'Regenerate API Key',
            prefixWarning: 'By regenerating, ',
            warning: 'the previous key will stop working',
            desc1: 'This means that:',
            point1: 'You will have to update all your bots and tools.',
            point2: 'You will not be able to recover the previous key.',
            disclaimer: 'This action cannot be undone.',
            confirm: 'Regenerate',
            regenerating: 'Regenerating...',
            cancel: 'Cancel',
        },
        postRegenKey: {
            title: 'New API Key',
            desc1: 'Please copy your new key:',
            point1: 'Keep it in a safe place.',
            point2: 'Do not share it with anyone.',
            disclaimer: 'If you lose it, you will have to generate another one.',
            copy: 'Copy to clipboard',
            copied: 'Copied!',
        },
        discordLink: {
            title: 'Link Discord',
            continue: 'Continue',
            desc1: 'You are about to link your Discord account.',
            desc2: 'By doing so:',
            point1: 'You can use commands from Discord.',
            point2: 'Your account will be more secure.',
            point3: 'You will receive important notifications.',
            disclaimer: 'You can unlink it at any time.',
        },
        discordUnlink: {
            title: 'Unlink Discord',
            unlinking: 'Unlinking...',
            confirm: 'Unlink',
            descUsername: (username: string): string => `You are about to unlink the account: ${username}`,
            descNoUsername: 'You are about to unlink your Discord account.',
            desc2: 'By doing so:',
            point1: 'You can no longer use commands from Discord.',
            point2: 'Your Discord data will be deleted.',
            point3: 'You will stop receiving notifications.',
            disclaimer: 'You can link it again later.',
        },
        discordResult: {
            close: 'Close',
            gotIt: 'Got it',
            linked: {
                title: 'Discord Linked',
                lead: 'Your account has been linked.',
                points: ['You can now use commands.', 'Your account is secured.'],
                hint: 'Thank you for using LosPerris API!',
            },
            unlinked: {
                title: 'Discord Unlinked',
                lead: 'Your account has been unlinked.',
                points: ['Your data has been deleted.', 'You will no longer receive notifications.'],
            },
            errorTaken: {
                title: 'Linking Error',
                lead: 'This account is already in use.',
                points: ['Try with another account.', 'Contact support if you think this is an error.'],
            },
            errorAuth: {
                title: 'Authentication Error',
                lead: 'We could not verify your account.',
                points: ['Try again.', 'Make sure you are logged in.'],
            },
            errorConfig: {
                title: 'Configuration Error',
                lead: 'There is a problem with the configuration.',
                points: ['Contact support.', 'Try again later.'],
            },
            error: {
                title: 'Unknown Error',
                lead: 'Something went wrong.',
                points: ['Try again.', 'If the problem persists, contact us.'],
            },
        },
        userInspect: {
            close: 'Close',
            rank: 'Rank',
            userId: 'User ID',
            copyId: 'Copy ID',
            copied: 'Copied',
            accountAge: 'Account Age',
            noBio: 'No biography.',
            chatHistory: 'Chat History',
            noMessages: 'No messages recorded in this session.',
            accountCreated: (date: string): string => `Account created: ${date}`,
            viewHistory: 'View chat history'
        },
        login: {
            cancel: 'Cancel',
            title: 'Authorization Required',
            validating: 'Connecting...',
            accept: 'Connect with Twitch',
            desc1: 'To access the Dashboard, you need to link your ',
            desc1Bold: 'Twitch',
            desc1End: ' channel.',
            desc2: 'By continuing, you authorize LosPerris to:',
            point1: 'Read your channel\'s public information.',
            point2: 'View and manage real-time streaming analytics.',
            point3: 'Synchronize and manage your chat commands.',
            disclaimer: 'The connection is completely secure via Twitch OAuth. We do not have access to or store your password. You can revoke these permissions at any time from your Twitch account connections settings.',
            privacyLink: 'Privacy Policy',
            termsLink: 'Terms of Service'
        },
    },
    globals: {
        loading: {
            dashboard: 'Loading dashboard',
            panel: 'Loading panel',
            profile: 'Loading profile',
            clips: 'Loading clips',
            analytics: 'Loading analytics',
            commands: 'Loading commands',
            trends: 'Loading trends',
            stalker: 'Loading stalker',
            settings: 'Loading settings',
            starting: 'Starting...'
        },
        toasts: {
            offline: 'Connection lost. Trying to reconnect...',
            online: 'Connection restored with Twitch.',
            sessionExpiredLogin: 'Session expired. Please log in again.',
            unstableConnection: 'Unstable connection with Twitch. Retrying...',
            rouletteLoadError: 'Error loading roulette data.',
            rouletteChatError: 'Error connecting to chat.',
            rouletteSendError: 'Error sending message.',
            rouletteWinner: (username: string, count: number): string => `Winner: ${username} (${count} entries)!`,
            rouletteInscriptionsClosed: 'Inscriptions closed.',
            rouletteMissingFilter: 'Missing inscription filter.',
            rouletteInscriptionsOpened: 'Inscriptions opened.',
            rouletteAnnounceOn: 'Announcements turned on.',
            rouletteAnnounceOff: 'Announcements turned off.',
            trendsChatError: 'Trends chat error.',
            trendsWinner: (word: string, count: number): string => `Winning trend: ${word} (${count} mentions)!`,
            trendsTimeUp: 'Time is up!',
            trendsStarted: (minutes: number): string => `Trends started for ${minutes} minutes.`,
            overlayExpired: 'Overlay link expired.',
            sessionExpired: 'Session expired.'
        }
    },
    clips: {
        title: 'Clips',
        info: 'Explore and manage your Twitch clips.',
        btnFavsOnly: 'Show favorites only',
        btnReload: 'Reload clips',
        tooltip: 'Clip management',
        searchPlaceholder: 'Search clips...',
        sortLabel: 'Sort by',
        noClips: 'No clips found.',
        viewClip: 'View Clip',
        playClip: (title) => `Play clip: ${title}`,
        favorite: 'Add to favorites',
        copyLink: 'Copy link',
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
        },
        overlay: {
            close: 'Close',
            openTwitch: 'Open on Twitch',
            errorInfo: 'Error loading',
            player: 'Clip Player',
            defaultTitle: 'Clip',
        }
    },
    commands: {
        config: {
            follow: {
                title: '!followage Command',
                desc: 'Shows how long someone has been following you',
                info: 'Generates the code so your bot can reply with the exact time a user has been following you.',
                templatePlaceholder: 'Ex: {user} has been suffering for {time}.',
                templateVars: 'Available variables: {user}, {time}, {channel}',
            },
            clip: {
                title: '!clip Command',
                desc: 'Allows creating clips from chat',
                info: 'Your mods can create instant clips by typing !clip. Requires being live. Wizebot and Fossabot already include a native !clip, no need to integrate the API.',
                templatePlaceholder: 'Ex: Look at this clip from {user}! 👉 {url}',
                templateVars: 'Available variables: {user}, {url}',
            },
            shoutout: {
                title: '!so Command',
                desc: 'Shoutout another streamer',
                info: 'Generates a link so your bot can do a Shoutout with the game and channel link.',
                templatePlaceholder: 'Ex: Drop a follow to {user}, playing {game} 👉 {url}',
                templateVars: 'Available variables: {user}, {game}, {url}',
            },
            magic8: {
                title: '!8ball Command',
                desc: 'Command for your viewers to ask the AI',
                info: 'Generates the code to add the Magic 8 Ball command to your chat bot.',
                extraSelectors: {
                    mood: {
                        label: 'Personality',
                        options: {
                            classic: 'Classic',
                            sarcastic: 'Sarcastic',
                            toxic: 'Toxic',
                            helpful: 'Helpful'
                        }
                    }
                }
            },
            russian: {
                title: '!roulette Command',
                desc: 'Russian Roulette game for chat',
                info: 'Your viewers can play Russian Roulette by typing !roulette.',
                extraSelectors: {
                    hardcore: {
                        label: 'Hardcore Mode',
                        options: {
                            false: 'Disabled',
                            true: 'Enabled (60s timeout)'
                        }
                    }
                }
            },
            duel: {
                title: '!duel Command',
                desc: '1vs1 narrated duel (Nightbot: 3 messages)',
                info: 'With Nightbot the bot tells the duel in 3 messages. In other bots it appears on a single line.',
            }
        },
        generator: {
            variables: 'Available variables:',
            botSelect: 'Select Bot',
            langSelect: 'Bot response language',
            langOptions: {
                es: 'Español',
                en: 'English',
                pt: 'Português',
            },
            customMsg: 'Custom Message',
            copyFormat: 'Copy Format',
            formatFull: 'Full Command',
            formatUrl: 'URL Only',
            ariaGenerated: 'Generated command',
            btnCopied: 'Copied!',
            btnCopy: 'Copy',
            toasts: {
                noCommand: 'Could not generate',
                copied: 'Command copied',
                copyError: 'Error copying',
                apiError: 'Connection error',
            },
        },
        views: {
            errors: {
                missingFields: 'Missing required fields',
            },
            followage: {
                testTitle: 'Test Followage',
                testDesc: 'Check how long someone has been following',
                testTooltip: 'Test tool',
                channelLabel: 'Channel',
                channelPlaceholder: 'Channel',
                userLabel: 'User',
                userPlaceholder: 'User',
            },
            watchtime: {
                testTitle: 'Test Watchtime',
                testDesc: 'Check how long someone has been watching the stream',
                testTooltip: 'Test tool',
                channelLabel: 'Channel',
                channelPlaceholder: 'Channel',
                userLabel: 'User',
                userPlaceholder: 'User',
                disclaimerTitle: 'Requires StreamElements',
                disclaimerWhat: 'What is watchtime?',
                disclaimerSubtitle: 'How does watchtime work?',
                disclaimerText: 'This command gets the time a user has been watching your channel using the public StreamElements API. It does not use native Twitch data.',
                disclaimerStep1: '⚠️ It only works if the channel has the Loyalty/Points system enabled on StreamElements (streamelements.com). If the channel is not registered there, the command will return an error.',
                disclaimerStep2: '💡 To enable it, the streamer must go to StreamElements › Loyalty and enable the points system. Once active, the bot will start tracking time automatically.',
            },
            shoutout: {
                testTitle: 'Test Shoutout',
                testDesc: 'Give a shoutout to another channel',
                testTooltip: 'Test tool',
                channelLabel: 'Source channel',
                channelPlaceholder: 'Your channel',
                userLabel: 'Target channel',
                userPlaceholder: 'User to shoutout',
            },
        },
        apiTest: {
            btnTest: 'Test',
            btnTesting: 'Testing...',
        },
    },
    feedback: {
        hintAnonymous: 'The message will be anonymous',
        hintDiscord: (username: string): string => `You will be contacted via Discord (${username})`,
        hintTwitch: (username: string): string => `You will be contacted via Twitch (${username})`,
        errorEmpty: 'Message cannot be empty',
        successSend: 'Message sent successfully',
        errorSend: 'Error sending message',
        errorGeneric: 'An unexpected error occurred',
        title: 'Send Feedback',
        desc: 'Help us improve',
        infoTooltip: 'Send suggestions or report bugs',
        messageLabel: 'Message',
        messagePlaceholder: 'Type your message here...',
        anonymousTitle: 'Send anonymously',
        anonymousOn: 'On (Anonymous)',
        anonymousOff: 'Off (Public)',
        sendAs: 'Send as',
        linkDiscordText: 'Join our ',
        linkDiscordBold: 'Discord',
        linkDiscordEnd: ' for fast support.',
        footerText: 'Thank you for your feedback.',
        btnSending: 'Sending...',
        btnSend: 'Send Message',
    },
    minigames: {
        magic8: {
            title: 'Magic 8 Ball',
            desc: 'Random answers to your questions',
            info: 'Chat minigame',
            testDesc: 'Test the Magic 8 Ball',
            testInfo: 'Send a test question',
            questionLabel: 'Question',
            questionPlaceholder: 'Will I win the match?',
            btnLoading: 'Asking...',
            btnAsk: 'Ask',
            loadingResult: 'Waiting for response...',
            errorEmpty: 'Question cannot be empty',
            testTitle: 'Test Magic 8',
        },
        duel: {
            title: 'Duel',
            desc: 'Face-off between viewers',
            info: 'Chat minigame',
            errorEmptyTarget: 'You must specify a target',
            errorInvalidLogin: 'Invalid user',
            testTitle: 'Test Duel',
            testDesc: 'Start a test duel',
            testInfo: 'Simulate a duel in chat',
            targetLabel: 'Target',
            targetPlaceholder: 'Ex: John',
            challengerLabel: 'Challenger',
            challengerPlaceholder: 'Ex: Peter',
            btnLoading: 'Fighting...',
            btnFight: 'Fight',
            loadingResult: 'Waiting for result...',
        },
        russian: {
            title: 'Russian Roulette',
            desc: 'Risk game for the chat',
            info: 'Chat minigame',
            errorUnknown: 'Unknown error',
            errorJammed: 'The gun jammed',
            testTitle: 'Test Russian Roulette',
            testDesc: 'Start the test game',
            btnTrigger: 'Pull the trigger',
            loadingResult: 'Waiting...',
        },
        roulette: {
            title: 'Giveaway Roulette',
            desc: 'Dynamic live giveaways',
            info: 'Interactive overlay',
            noParticipants: 'No participants',
            pressPlay: 'Press Spin to start',
            spinning: 'Spinning...',
            winner: 'Winner!',
            participants: 'Participants',
            notAnnounced: 'Not announced',
            close: 'Close',
            announceChatOn: 'Announce in chat (On)',
            announceChatOff: 'Announce in chat (Off)',
            inChat: 'In chat',
            pauseEntries: 'Pause entries',
            openEntries: 'Open entries',
            listUpdated: 'List updated',
            reloadUsers: 'Reload users',
            infoTooltip: 'Select who can participate',
            spinBtn: 'Spin Roulette',
            twitchDelay: 'Twitch delay ~3s',
            waitingChat: 'Waiting for chat...',
            whoCanPlay: 'Who can play',
            all: 'Everyone',
            none: 'No one',
            roles: {
                subs: 'Subscribers',
                mods: 'Mods',
                vips: 'VIPs',
                viewers: 'Viewers'
            }
        },
    },
    stalker: {
        toasts: {
            copied: 'Copied to clipboard',
            cleared: 'List cleared',
            error: 'Connection error',
            started: 'Stalker started',
            paused: 'Stalker paused',
            errorLoad: 'Error loading',
            errorChat: 'Chat error',
            errorInfo: 'Information error',
            reloaded: 'Reloaded successfully',
        },
        title: 'Stalker Mode',
        info: 'Analyze chat in real-time',
        searchPlaceholder: 'Search in messages...',
        btnPause: 'Pause',
        btnStart: 'Start',
        btnReload: 'Clear',
        tooltip: 'Keyword monitor',
        table: {
            user: 'User',
            message: 'Message',
            time: 'Time',
            actions: 'Actions',
            empty: 'No data',
            avatar: 'Avatar',
            login: 'Login',
            action: 'Action',
            readyTitle: 'Ready to start',
            readyDesc: 'The monitor is waiting.',
            waiting: 'Waiting for messages...',
            btnView: 'View on Twitch',
        },
        footer: 'Showing latest messages',
    },
    trends: {
        countdown: (val: string): string => `${val} remaining`,
        remaining: 'remaining',
        title: (duration?: string): string => duration ? `Trends (${duration})` : 'Trends (Top Words)',
        status: {
            idle: 'Idle',
            active: 'Active',
            finished: 'Finished',
            error: 'Error',
            connected: 'Connected',
            connecting: 'Connecting...',
            synced: 'Synced',
        },
        info: 'Measures most used words',
        duration: 'Duration (minutes)',
        btnDecrease: '-',
        inputLabel: 'Minutes',
        min: 'min',
        btnIncrease: '+',
        startTimer: 'Start Measurement',
        reset: 'Reset',
        tooltip: 'Measures chat engagement',
        table: {
            word: 'Word',
            count: 'Mentions',
            empty: 'Not enough data',
            reps: 'Repetitions',
            readyTitle: 'Ready to start',
            readyDesc: 'Select time and start.',
            waiting: 'Waiting for data...',
            noData: 'Not enough data',
        },
    },
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
                urlDetail: 'Paste the URL you copied from the panel (Overlay button).',
                sizeTitle: 'Size',
                sizeDetail: (size: string): string => `${size}, transparent background.`,
                refreshTitle: 'On scene active',
                refreshDetail: 'Check "Refresh browser when scene becomes active".'
            },
            obsNote: 'It only displays on screen. To start, spin, or reset, use the panel.',
            slTitle: 'Setup in Streamlabs',
            slSteps: {
                sourceTitle: 'New source',
                sourceDetail: 'Sources → Custom Widget or Browser Source.',
                urlTitle: 'Paste URL',
                urlDetail: 'Paste the URL you copied from the panel (Overlay button).',
                sizeTitle: 'Size',
                sizeDetail: (size: string): string => `${size}, no background color.`,
                refreshTitle: 'On scene show',
                refreshDetail: 'Enable auto-refresh if your plan allows it.'
            },
            slNote: 'If the source is black, check the size, transparent background, and refresh on scene show.',
            tools: {
                trends: 'Trends',
                roulette: 'Roulette'
            },
            sizes: {
                trends: '900 × 580 px (top 10; full width if preferred)',
                roulette: '720 × 720 px'
            }
        },
        banners: {
            connecting: 'Connecting overlay…',
            waiting: 'Waiting for dashboard data…'
        },
        gate: {
            invalidLink: 'Invalid overlay link. Generate a new one from the dashboard.'
        },
        apps: {
            rouletteErrorTitle: 'Roulette Overlay',
            trendsErrorTitle: 'Trends Overlay'
        }
    }
};
