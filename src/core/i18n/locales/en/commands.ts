/** Fragmento i18n: commands (en). */
export const commands = {
commands: {
        config: {
            follow: {
                title: '!followage Command',
                desc: 'Shows how long someone has been following you',
                info: 'Generates the code so your bot can reply with the exact time a user has been following you.',
                templatePlaceholder: 'Ex: {user} has been suffering for {time}.',
                templateVars: 'Available variables: {user}, {time}, {channel}',
            },
            watchtime: {
                title: '!watchtime Command',
                desc: 'Shows how long someone has been watching the stream',
                info: 'Generates the code so your bot can reply with how long a viewer has been in the channel.',
                templatePlaceholder: 'Ex: {user} has been watching for {time}.',
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
            },
            slots: {
                title: '!slots command',
                desc: 'Slot machine for chat',
                info: 'On Nightbot the reels come in 3 messages. On other bots, only the final result.',
            }
        },
        generator: {
            variables: 'Available variables:',
            insertVar: 'Insert {var} into the message',
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
            httpError: (status: number): string => `HTTP error ${status}.`,
            docsErrors: 'See error help',
            docsLimits: 'See rate limits',
        },
    }
};
