export const CommandGenerator = {
    bots: {
        nightbot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '$(user)';
                if (name === 'touser') return '$(touser)';
                if (name === 'query') return '$(querystring)';
                if (name === 'args') return '$(querystring)';
                if (name === '1') return '$(touser)';
                return `$(${name})`;
            },
            addcmd: (trigger: string, cmd: string) => `!addcom ${trigger} ${cmd}`
        },
        streamelements: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '${user}';
                if (name === 'touser') return '${touser}';
                if (name === 'query') return '$(queryescape ${1:})';
                if (name === 'args') return '${1:}';
                if (name === '1') return '${1:}';
                return `\${${name}}`;
            },
            addcmd: (trigger: string, cmd: string) => `!command add ${trigger} ${cmd}`
        },
        fossabot: {
            urlfetch: (url: string) => `$(customapi ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '$(user)';
                if (name === 'touser') return '$(touser)';
                if (name === 'query') return '$(querystring)';
                if (name === 'args') return '$(query)';
                if (name === '1') return '$(query)';
                return `$(${name})`;
            },
            addcmd: (trigger: string, cmd: string) => `!addcmd ${trigger} ${cmd}`
        },
        wizebot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '$(user_name)';
                if (name === 'touser') return '$(arg_touser)';
                if (name === 'query' || name === 'args') return '$(arg_1+)';
                if (name === '1') return '$(arg_1)';
                return `$(arg_${name})`;
            },
            addcmd: (trigger: string, cmd: string) => `!command add ${trigger} ${cmd}`
        },
        streamlabs: {
            urlfetch: (url: string) => `{readapi.${url}}`,
            arg: (name: string) => {
                if (name === 'user' || name === 'sender') return '{user.name}';
                if (name === 'touser') return '{touser.name}';
                if (name === 'query' || name === 'args') return '{1:}';
                if (name === '1') return '{1}';
                return `{${name}}`;
            },
            addcmd: (trigger: string, cmd: string) => `${trigger}: ${cmd}`
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
    { value: 'wizebot', label: 'Wizebot' },
    { value: 'streamlabs', label: 'Streamlabs' }
];
