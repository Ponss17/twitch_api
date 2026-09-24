/** Fragmento i18n: reports (en). */
export const reports = {
reports: {
        title: 'Reports',
        eyebrow: 'Closed month',
        browseByMonth: 'Archive',
        months: 'Months',
        metaCategory: 'Saved report',
        latestBadge: 'Latest',
        entryTitle: 'Report for {month}',
        checkUses: '{count} total uses',
        checkSuccess: '{rate}% without errors',
        checkCommand: 'Most used: {command}',
        checkViewer: 'Top chat: {viewer}',
        checkLatency: '{ms} ms average',
        intro: 'Closed summary of how your LosPerris chat commands were used that month.',
        note: 'This is not live Analytics or Twitch channel stats — a locked report for a finished month (API usage only).',
        story: 'That month closed with {uses} command uses ({rate}% OK). Most requested: {command}. In chat, the top trigger was {viewer}.',
        storyTitle: 'In short',
        storyNoCommand: 'no command',
        storyNoViewer: 'nobody in chat',
        downloadTitle: 'Save this report',
        downloadAction: 'Download',
        downloadHtmlDesc: 'A page you can save or share.',
        downloadCsvDesc: 'For Excel or Google Sheets.',
        emptyTitle: 'No closed month yet',
        emptyBody:
            'When a month ends with command usage, the archived report lands here and we ping the bell. For the live view, open Analytics.',
        emptyCtaAnalytics: 'Go to live Analytics',
        emptyCtaCommands: 'Set up a command',
        monthMeta: '{count} uses · {rate}% OK',
        monthMetaOne: '1 use · {rate}% OK',
        commands: 'Detail: commands',
        commandsHint: 'What chat asked for that month',
        listCommand: 'Command',
        listUses: 'Uses',
        listLatency: 'Avg',
        listViewer: 'User',
        noCommands: 'No commands that month',
        commandUses: '{count} times',
        commandUsesOne: '1 time',
        commandLatency: '{ms} ms avg',
        topViewers: 'Detail: chat',
        topViewersHint: 'Who triggered commands that month',
        viewerUses: '{count} times',
        viewerUsesOne: '1 time',
        noViewers: 'No one in chat used commands that month.',
        lowActivity:
            'A quiet month ({count} uses). Normal if you had just set up commands.',
        lowActivityOne:
            'Only 1 use that month. Normal if you had just set up commands.',
        downloadHtml: 'Download HTML',
        downloadCsv: 'Download CSV',
        loadError: 'Could not load reports.',
        vsPrevious: 'Vs {month}: no change in uses',
        vsPreviousUp: 'Vs {month}: {delta} more uses',
        vsPreviousDown: 'Vs {month}: {delta} fewer uses',
        notificationTitle: 'Report ready: {month}',
        notificationBody: 'You can read or download the closed-month summary.',
        openReport: 'Open report',
        howItWorks: 'How does it work?',
        howItWorksDesc: 'About closed-month reports',
        howItWorksFaq: [
            {
                q: 'What does Reports store?',
                a: 'When a month ends with LosPerris command usage, we archive that month’s data. This is not the live panel: Analytics still shows what’s current; here you keep the closed summary to review or download later.'
            },
            {
                q: 'Does the current month show up here?',
                a: 'Not yet. What you use today appears in Analytics. That month’s report is only created after the month ends and there was command usage; if there was none, no archive is created.'
            },
            {
                q: 'If I reset statistics in Settings → Data, are reports deleted?',
                a: 'No. Resetting statistics clears the live counters, but archived reports are kept. They are only removed if you delete your account entirely.'
            }
        ],
        kpis: {
            requests: 'Total uses',
            requestsHint: 'Times someone ran a command',
            success: 'Succeeded',
            successHint: 'Percent without errors',
            latency: 'Speed',
            latencyHint: 'Average response time',
            commands: 'Distinct commands',
            commandsHint: 'Command types used'
        }
    }
};
