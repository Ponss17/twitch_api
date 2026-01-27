export const CommandGenerator = {
    masks: {
        apiKey: '**************',
        token: '**************'
    },

    bots: {
        nightbot: {
            urlfetch: (url: string) => `$(urlfetch ${url})`,
            arg: (name: string) => {
                if (name === 'user') return '$(touser)';
                if (name === 'query') return '$(querystring)';
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

        const fullUrl = `${url}?${queryParams}`;

        return bot.urlfetch(fullUrl);
    },

    maskSecrets(cmd: string, secrets: any = {}) {
        let masked = cmd;
        if (secrets.apiKey) masked = masked.split(secrets.apiKey).join(this.masks.apiKey);
        if (secrets.token) masked = masked.split(secrets.token).join(this.masks.token);
        return masked;
    }
};
