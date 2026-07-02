export const CommandGenerator = {
    bots: {
        nightbot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '$(user)';
                if (name === 'touser') return '$(touser)';
                if (name === 'query') return '$(1+)';
                return `$(${name})`;
            },
            addcmd: (trigger: string, cmd: string) => `!addcom ${trigger} ${cmd}`
        },
        streamelements: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => `\${${name}}`,
            addcmd: (trigger: string, cmd: string) => `!command add ${trigger} ${cmd}`
        },
        fossabot: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => {
                if (name === 'user') return '{{user.name}}';
                return `{{${name}}}`;
            },
            addcmd: (trigger: string, cmd: string) => `!addcmd ${trigger} ${cmd}`
        },
        wizebot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => `$(arg_${name === 'user' ? '1' : name})`,
            addcmd: (trigger: string, cmd: string) => `!command add ${trigger} ${cmd}`
        }
    } as Record<string, { urlfetch: (url: string) => string; arg: (name: string) => string; addcmd: (trigger: string, cmd: string) => string }>,

    generate(botName: string, url: string, queryParams: string) {
        const bot = this.bots[botName] || this.bots.nightbot;
        return bot.urlfetch(`${url}?${queryParams}`);
    }
};

export const BOT_OPTIONS = [
    { value: 'nightbot', label: 'Nightbot' },
    { value: 'streamelements', label: 'StreamElements' },
    { value: 'fossabot', label: 'Fossabot' },
    { value: 'wizebot', label: 'Wizebot' }
];
