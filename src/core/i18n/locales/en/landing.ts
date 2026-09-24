/** Fragmento i18n: landing (en). */
export const landing = {
landing: {
        nav: {
            sectionsAria: 'Sections',
            product: 'Product',
            docs: 'Docs',
            discord: 'Discord'
        },
        cta: {
            start: 'Get started',
            reconnect: 'Reconnect with Twitch',
            panelShort: 'Panel',
            goToPanel: 'Go to Panel',
            panelAria: 'Control panel'
        },
        resources: {
            docsTitle: 'Official documentation',
            docsText:
                'Step-by-step guides, command variables, and detailed tutorials so you can set up your panel and integrations in minutes.',
            docsCta: 'Read the docs',
            discordTitle: 'Discord community',
            discordText:
                'Join our server. Get answers in real time, suggest features, and meet other creators like you.',
            discordCta: 'Join the server'
        },
        features: {
            stepsTitle: 'Start with a command',
            stepsSubtitle: 'Easy in 3 steps. All from the browser.',
            panelTitle: 'Everything in one panel',
            panelSubtitle: 'Commands, overlays, and minigames. No extra app.',
            steps: {
                connect: {
                    title: 'Connect Twitch',
                    text: 'Sign in with your streamer account. Everything runs in the browser — no extra installs.'
                },
                generate: {
                    title: 'Generate the command',
                    text: 'Pick followage, watchtime, clips, or shoutout. The panel builds the command with your API key, ready to copy.'
                },
                bots: {
                    title: 'Paste it in your bot',
                    text: 'Nightbot, StreamElements, or Streamlabs. Paste it as a custom command and chat can use it.'
                }
            },
            panels: {
                commands: {
                    title: 'Commands',
                    text: 'Followage, watchtime, clips, and shoutouts. Chat asks; the bot replies with text from the API.',
                    items: ['!followage', '!watchtime', '!clip', '!so']
                },
                tools: {
                    title: 'Tools',
                    text: 'Trends, stalker, roulette, and questions. Several include an overlay URL for OBS browser sources.',
                    items: ['Trends', 'Roulette', 'Questions', 'Stalker']
                },
                minigames: {
                    title: 'Minigames',
                    text: '8-ball, Russian roulette, duels, and slots. Chat plays on its own; you stay on stream.',
                    items: ['!8ball', '!roulette', '!duel', '!slots']
                }
            }
        },
        hero: {
            headlineLine1: 'Commands for your',
            headlineLine2: 'Stream.',
            subtitle: 'Commands, overlays, and minigames. Paste into Nightbot, StreamElements, Streamlabs, or OBS.',
            legacyNotice: 'Your previous session is no longer valid. Connect with Twitch again.',
            seePanel: 'See the panel',
            disclaimerBefore: 'By connecting you accept the',
            privacy: 'privacy policy',
            disclaimerAnd: 'and the',
            terms: 'terms of use',
            disclaimerAfter: '.',
            tablistAria: 'The panel',
            tabs: {
                inicio: {
                    label: 'Panel',
                    text: 'The LosPerrisAPI panel: commands, overlays, and minigames in one place.'
                },
                comandos: {
                    label: 'Commands',
                    text: 'The generator builds the command for Nightbot, StreamElements, or Streamlabs.'
                },
                herramientas: {
                    label: 'Tools',
                    text: 'OBS overlays and panel utilities — no other app needed.'
                },
                minijuegos: {
                    label: 'Minigames',
                    text: 'Chat plays on its own. You stay on stream.'
                }
            }
        },
        fit: {
            title: 'Just copy and paste',
            subtitle: 'No extra bot to install. The command or URL goes to Nightbot, StreamElements, Streamlabs, or OBS.',
            chatTitle: 'Stream chat',
            welcome: 'Welcome to the chat room for ponss17!',
            hello: 'hey',
            sendPlaceholder: 'Send a message',
            demoTabsAria: 'Try a command',
            moderator: 'Moderator',
            streamer: 'Streamer',
            points: {
                free: {
                    title: '100% Free',
                    text: 'The panel is completely free with no hidden fees.'
                },
                browser: {
                    title: 'No install',
                    text: 'Everything runs in the browser. No exe or extension.'
                },
                bots: {
                    title: 'Keep your bot',
                    text: 'Keep using Nightbot, StreamElements, or Streamlabs.'
                }
            },
            demos: {
                followage: {
                    label: 'Followage',
                    reply: 'mynana17 has followed ponss17 for 2 years and 3 months.'
                },
                watchtime: {
                    label: 'Watchtime',
                    reply: 'mynana17 has been watching ponss17 for 2 years and 3 months.'
                },
                '8ball': {
                    label: '8ball',
                    reply: 'The stars align in your favor, @mynana17... but your future choices worry me. YES.'
                },
                so: {
                    label: 'Shoutout',
                    reply: 'Go follow mynana17! They were playing Just Chatting'
                }
            }
        },
        faq: {
            title: 'Frequently asked questions',
            subtitle: 'Free, bots, and OBS. What people ask before connecting.',
            items: {
                gratis: {
                    title: 'Is it free?',
                    content: 'Yes. LosPerrisAPI is completely free. You can use every panel feature at no cost.'
                },
                bots: {
                    title: 'Which bots work?',
                    content: 'Nightbot, StreamElements, and Streamlabs. Copy the command from the panel and paste it into your bot.'
                },
                empezar: {
                    title: 'How do I start?',
                    content: 'Connect Twitch, pick a command or overlay, and paste it into your bot or OBS. Ready in about a minute.'
                },
                permisos: {
                    title: 'What Twitch permissions does it ask for?',
                    content: 'Only what is needed to identify your channel and generate commands. We do not post to your chat or change the stream.'
                },
                obs: {
                    title: 'Can I use it in OBS?',
                    content: 'Yes. Trends, roulette, questions, and other tools have overlays: copy the URL and add it as a browser source.'
                }
            }
        },
        users: {
            title: 'Streamers using the API',
            subtitle: 'Join streamers who already trust the API on their streams.',
            noDescription: 'No Twitch description.',
            loadingAria: 'Loading pioneers',
            twitchChannelAria: (name: string): string => `${name}'s Twitch channel`
        }
    }
};
