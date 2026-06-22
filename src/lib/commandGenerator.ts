export const CommandGenerator = {
    bots: {
        nightbot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '$(user)';
                if (name === 'touser') return '$(touser)';
                if (name === 'query') return '$(1+)';
                return `$(${name})`;
            }
        },
        streamelements: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => `\${${name}}`
        },
        fossabot: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => {
                if (name === 'user') return '{{user.name}}';
                return `{{${name}}}`;
            }
        },
        wizebot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => `$(arg_${name === 'user' ? '1' : name})`
        }
    } as Record<string, { urlfetch: (url: string) => string; arg: (name: string) => string }>,

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
