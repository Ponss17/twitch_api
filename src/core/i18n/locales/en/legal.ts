/** Fragmento i18n: legal (en). */
export const legal = {
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

verifying: {
        authenticated: 'AUTHENTICATED',
        accessGranted: 'Access granted. Redirecting...',
        cacheActive: 'Local cache active — fast load.',
        noCache: 'Syncing secure profile...',
    }
};
