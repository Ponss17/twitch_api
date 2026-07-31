import type { Translations } from './es';

export const en: Translations = {
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
            security: 'Security',
            connections: 'Connections',
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
                description: 'Choose the language in which the dashboard is displayed.',
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
        },
    },

    // --- Dashboard Home ---
    home: {
        welcome: 'Welcome',
        quickStats: 'Quick Stats',
        recentActivity: 'Recent Activity',
        noActivity: 'No recent activity.',
        requests: 'requests',
        successRate: 'success rate',
        avgLatency: 'avg latency',
        today: 'today',
    },

    // --- Common ---
    common: {
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
        confirm: 'Confirm',
        copy: 'Copy',
        copied: 'Copied',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
    },
};
